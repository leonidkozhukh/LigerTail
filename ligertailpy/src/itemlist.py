import model
import logging
from filterstrategy import filterStrategy
from google.appengine.ext import db
from google.appengine.api import memcache
from google.appengine.api import taskqueue
from activitymanager import activityManager
from activitymanager import Singleton


def addToBucket_(bucketKey, entity):
  ''' Transactional method
  '''
  bucket = db.get(bucketKey)
  bucket.entities.append(entity)
  bucket.put()

def emptyBucket_(bucketKey):
  bucket = db.get(bucketKey)
  entities = bucket.entities
  bucket.entities = []
  bucket.put()
  return entities

  
class ItemList(Singleton):
  
  def getItemBucketId_(self, itemId, publisherUrl, numBuckets):
    return '%s_%d' % (publisherUrl, itemId % numBuckets)
  
  def getItemBucketIds_(self, publisherUrl, numBuckets):
    return ['%s_%d' % (publisherUrl, i) for i in range(0, numBuckets)]
  
  def getBucketId_(self, bucketIndex, publisherUrl):
    return '%s_%d' % (publisherUrl, bucketIndex)
  
  def updateItem(self, publisherUrl, itemId, item, bNew, statType, spot):
    numBuckets = activityManager.getNumBuckets(publisherUrl)
    if not itemId and item:
      itemId = item.key().id()
    if not itemId:
      itemId = 0
    bucketId = self.getItemBucketId_(itemId, publisherUrl, numBuckets)  
    entity = model.ItemUpdateEntity(itemId, bNew, statType, spot)
    bucket = model.getBucket(bucketId)
    
    db.run_in_transaction(addToBucket_, bucket.key(), entity)
    if (item and item.publisherUrl != publisherUrl):
      logging.error('mismatched publisherUrl for item %s, %d. Expected %s but found %s',
                    item.url, itemId, publisherUrl, item.publisherUrl)
    activityManager.initiateItemUpdateProcessing(publisherUrl)

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
    publisherSite = model.getPublisherSite(publisherUrl)
    numBuckets = activityManager.getNumBuckets(publisherUrl)
    bucketIds = self.getItemBucketIds_(publisherUrl, numBuckets)
    entities = {}
    for bucketId in bucketIds:
      bucket = model.getBucket(bucketId)
      entities[bucketId] = db.run_in_transaction(emptyBucket_, bucket.key())
      #TODO: mapreduce?
    for bucketId in bucketIds:
      items = {}
      spots = {}
      for entity in entities[bucketId]:
        if entity.itemId:
          # update items
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
            item.updateStats(entity.statType, entity.creationTime)
      
        # update spots
        if entity.spot != None:
          spot = None
          if not spots.has_key(entity.spot):
            if entity.spot > 0:
              spot = model.getSpot(publisherUrl, entity.spot)
              spots[entity.spot] = spot
          else:
            spot = spots[entity.spot]
          if spot:
            logging.info('updating spot %d: statType: %d', entity.spot, entity.statType)
            spot.updateStats(entity.statType, entity.creationTime)
          if entity.spot != None and entity.statType != None and entity.statType != model.StatType.VIEWS and entity.statType != model.StatType.UNIQUES:
            publisherSite.updateStats(entity.statType, entity.creationTime)
          elif entity.spot == 0 and (entity.statType == model.StatType.VIEWS or entity.statType == model.StatType.UNIQUES):
            logging.info('updating publisher site stats: statType: %d', entity.statType)
            publisherSite.updateStats(entity.statType, entity.creationTime)
        
      #TODO: use a method to store lists
      for item in items.values():
        item.put()
        
      for spot in spots.values():
        spot.put()
    
      publisherSite.put() 
      #TODO: write updates into timed log
      self.refreshCacheForDefaultOrderedItems(publisherUrl)
      activityManager.finishItemUpdateProcessing(publisherSite)
      newNumBuckets = activityManager.getNumBuckets(publisherUrl)
      if newNumBuckets < numBuckets:
        # If the number of buckets was decreased, move items from higher buckets to where the belong now
        # It is safe at this point because item updates go into the smaller buckets.
        leftoverBuckets = range(newNumBuckets, numBuckets)
        for i in leftoverBuckets:
          bucketId = self.getBucketId_(publisherUrl, i)
          bucket = model.getBucket(bucketId)
          entities = db.run_in_transaction(emptyBucket_, bucket.key())
          for entity in entities:
            newBucketId = self.getItemBucketId_(entity.itemId, publisherUrl, newNumBuckets)
            newBucket = model.getBucket(newBucketId)
            db.run_in_transaction(addToBucket_, newBucket.key(), entity)
      
    
itemList = ItemList()