import model
import logging
from filterstrategy import filterStrategy
from google.appengine.ext import db
from google.appengine.api import memcache
from google.appengine.api import taskqueue

NUM_SPOT_BUCKETS_PER_PUBLISHER_URL = 2
TOTAL_SPOT_UPDATES_BEFORE_RECALCULATING = 5

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

  
class SpotList(Singleton):
  
  # TODO: use model publisherUrlParams instead
  def getBucketId(self, spot, publisherUrl ):
    return '%s_spot_%d' % (publisherUrl, spot % NUM_SPOT_BUCKETS_PER_PUBLISHER_URL)
  
  def getBucketIds(self, publisherUrl):
    return ['%s_spot_%d' % (publisherUrl, i) for i in range(0,NUM_SPOT_BUCKETS_PER_PUBLISHER_URL)]
  
  def updateSpot(self, publisherUrl, spot, statType):
    ''' for performance purpose store updates only in memcache
    '''
    bucketId = self.getBucketId(spot, publisherUrl)  
    entity = model.SpotUpdateEntity(spot, statType)
    bucket = model.getBucket(bucketId)
  
    db.run_in_transaction(addToBucket, bucket.key(), entity)
    self.initiateSpotUpdateProcessing(publisherUrl)
  
  def initiateSpotUpdateProcessing(self, publisherUrl):
    numOfUpdates = memcache.incr('spot_num_updates_%s' % publisherUrl, initial_value=0)
    workerAdded = memcache.get('spot_worker_added_%s' % publisherUrl)
    if numOfUpdates >= TOTAL_SPOT_UPDATES_BEFORE_RECALCULATING and not workerAdded:
      logging.info('initiating spot update processing for %s', publisherUrl)
      memcache.set('spot_worker_added_%s' % publisherUrl, True)
      memcache.set('spot_num_updates_%s' % publisherUrl, 0) #do not update until reset
      taskqueue.add(url='/process_spot_updates', params={'publisherUrl': publisherUrl})
  
  def processSpotUpdates(self, publisherUrl):
    logging.info('process spot updates worker for %s', publisherUrl)
    publisherSite = model.getPublisherSite(publisherUrl)
    bucketIds = self.getBucketIds(publisherUrl)
    entities = {}
    for bucketId in bucketIds:
      bucket = model.getBucket(bucketId)
      entities[bucketId] = db.run_in_transaction(emptyBucket, bucket.key())
      #TODO: mapreduce?
    for bucketId in bucketIds:
      spots = {}
      for entity in entities[bucketId]:
        spot = None
        if not spots.has_key(entity.spot):
          if entity.spot:
            spot = model.getSpot(publisherUrl, entity.spot)
          else:
            spot = model.Spot() #temporary spot to store publisher site stats
            spot.spot = 0
          spots[entity.spot] = spot
        else:
          spot = spots[entity.spot]
        if spot:
          logging.info('updating spot %d: statType: %d', entity.spot, entity.statType)
          spot.updateStats(entity.statType, entity.creationTime)
          if entity.spot and entity.statType != model.StatType.VIEWS and entity.statType != model.StatType.UNIQUES:
            publisherSite.updateStats(entity.statType, entity.creationTime)
          elif entity.spot == 0 and (entity.statType == model.StatType.VIEWS or entity.statType == model.StatType.UNIQUES):
            logging.info('updating publisher site stats: statType: %d', entity.statType)
            publisherSite.updateStats(entity.statType, entity.creationTime)
      for spot in spots.values():
        if spot.spot:  #ignore 0 spot used to record publisher site stats
          spot.put()
      publisherSite.put()

    #TODO: write updates into timed log
    # reset number of updates
    memcache.set('spot_num_updates_%s' % publisherUrl, 0)
    memcache.set('spot_worker_added_%s' % publisherUrl, False)
    
spotList = SpotList()