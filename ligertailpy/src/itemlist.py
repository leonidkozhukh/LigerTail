import model
import logging
from filterstrategy import filterStrategy
from google.appengine.ext import db
from google.appengine.api import memcache
from google.appengine.api import taskqueue

NUM_BUCKETS_PER_PUBLISHER_URL = 2
TOTAL_UPDATES_BEFORE_RECALCULATING = 5

class Singleton(object):
  """ A Pythonic Singleton """
  def __new__(cls, *args, **kwargs):
    if '_inst' not in vars(cls):
      cls._inst = object.__new__(cls, *args, **kwargs)
    return cls._inst



def addToBucket(bucketKey, entity):
  ''' Transactional method
  '''
  bucket = db.get(bucketKey)
  bucket.entities.append(entity)
  bucket.put()

def emptyBucket(bucketKey):
  bucket = db.get(bucketKey)
  entities = bucket.entities
  bucket.entities = []
  bucket.put()
  return entities

  
class ItemList(Singleton):
  
  def getBucketId(self, itemId, publisherUrl ):
    return '%s_%d' % (publisherUrl, itemId % NUM_BUCKETS_PER_PUBLISHER_URL)
  
  def getBucketIds(self, publisherUrl):
    return ['%s_%d' % (publisherUrl, i) for i in range(0,NUM_BUCKETS_PER_PUBLISHER_URL)]
  
  def updateItem(self, publisherUrl, itemId, item, bNew, statType):
    ''' for performance purpose store updates only in memcache
    '''
    if not itemId:
      itemId = item.key().id()
    bucketId = self.getBucketId(itemId, publisherUrl)  
    entity = model.ItemUpdateEntity(itemId, bNew, statType)
    bucket = model.getBucket(bucketId)
  
    db.run_in_transaction(addToBucket, bucket.key(), entity)
    if (item and item.publisherUrl != publisherUrl):
      logging.error('mismatched publisherUrl for item %s, %d. Expected %s but found %s',
                    item.url, itemId, publisherUrl, item.publisherUrl)
    self.initiateItemUpdateProcessing(publisherUrl)
  
  def initiateItemUpdateProcessing(self, publisherUrl):
    numOfUpdates = memcache.incr('num_updates_%s' % publisherUrl, initial_value=0)
    workerAdded = memcache.get('worker_added_%s' % publisherUrl)
    if numOfUpdates >= TOTAL_UPDATES_BEFORE_RECALCULATING and not workerAdded:
      logging.info('initiating item update processing for %s', publisherUrl)
      memcache.set('worker_added_%s' % publisherUrl, True)
      memcache.set('num_updates_%s' % publisherUrl, 0) #do not update until reset
      taskqueue.add(url='/process_item_updates', params={'publisherUrl': publisherUrl})


  def getDefaultOrderedItems(self, publisherUrl):
    logging.info('getDefaultOrderedItems')
    defaultOrderedItems = memcache.get('def_list_%s' % publisherUrl)
    if defaultOrderedItems is not None:
      return defaultOrderedItems
    return self.refreshCacheForDefaultOrderedItems(publisherUrl)

  def refreshCacheForDefaultOrderedItems(self, publisherUrl):    
    items = model.getItems(publisherUrl)
    defaultOrderedItems = filterStrategy.applyFilter(items, model.getDefaultFilter())
    logging.info('repopulating memache for %s', publisherUrl)
    memcache.set('def_list_%s' % publisherUrl, defaultOrderedItems)
    return defaultOrderedItems

  
  def processUpdates(self, publisherUrl):
    logging.info('process updates worker for %s', publisherUrl)
    bucketIds = self.getBucketIds(publisherUrl)
    entities = {}
    for bucketId in bucketIds:
      bucket = model.getBucket(bucketId)
      entities[bucketId] = db.run_in_transaction(emptyBucket, bucket.key())
      #TODO: mapreduce?
    for bucketId in bucketIds:
      items = {}
      for entity in entities[bucketId]:
        item = None
        if not items.has_key(entity.itemId):
          item = model.Item.get_by_id(entity.itemId)
          if not item:
            logging.error('no item found for id %d', entity.itemId)
          else:
            items[entity.itemId] = item               
        else:
          item = items[entity.itemId]
        if entity.statType and item:
          logging.info('updating item %s: statType: %d', item.url, entity.statType)
          item.update(entity.statType, entity.creationTime)
      for item in items.values():
        item.put()
    #TODO: write updates into timed log
    self.refreshCacheForDefaultOrderedItems(publisherUrl)
    # reset number of updates
    memcache.set('num_updates_%s' % publisherUrl, 0)
    memcache.set('worker_added_%s' % publisherUrl, False)
    
itemList = ItemList()