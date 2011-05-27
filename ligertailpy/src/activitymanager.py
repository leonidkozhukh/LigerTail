import model
import logging
import time
import datetime
from google.appengine.ext import db
from google.appengine.api import memcache
from google.appengine.api import taskqueue

 
class Singleton(object):
  """ A Pythonic Singleton """
  def __new__(cls, *args, **kwargs):
    if '_inst' not in vars(cls):
      cls._inst = object.__new__(cls, *args, **kwargs)
    return cls._inst
  
class ActivityManager(Singleton):
  def __init__(self):
    self.activities = []
    self.lastLoad = datetime.datetime.utcnow()
    # TODO be able to update via UI
    self.timeToRefresh = datetime.timedelta(0, 120)
    self.numDeltasInThePast = 8
    self.activityDelta = model.MINUTELY
    self.averageOf = 4
    
  def getActivityPeriod(self):
    return self.activityDelta.name
  
  def lazyLoad_(self, refresh):
    if not len(self.activities) or refresh:
      self.lastLoad = datetime.datetime.utcnow()
      self.activities = model.getActivities(True)
      logging.info('Reloading %d activities' % len(self.activities))
  
  def getPublisherActivityLoad_(self, publisherUrl):
    activityLoad = memcache.get('activityLoad_%s' % publisherUrl)
    if not activityLoad:
      publisherSite = model.getPublisherSite(publisherUrl)
      return self.updatePublisherActivityLoad_(publisherSite)
    return activityLoad

  def updatePublisherActivityLoad_(self, publisherSite):        
    activityLoad = 0
    for i in range(0, self.averageOf):
      activityLoad += publisherSite.timedStats.durations[self.activityDelta.id][self.numDeltasInThePast - i][model.StatType.VIEWS]
    activityLoad /= self.averageOf
    logging.info('current activity load %d' % activityLoad)
    memcache.set('activityLoad_%s' % publisherSite.publisherUrl, activityLoad)
    return activityLoad

  def getActivityParamsForPublisherUrl_(self, publisherUrl):
    publisherActivityLoad = self.getPublisherActivityLoad_(publisherUrl)
    for activity in self.activities:
      if publisherActivityLoad <= activity.activity_load:
        #logging.info('ACTIVITY[%d]: %s for %s' % (publisherActivityLoad, activity.name, publisherUrl))
        return activity
    # No match found, return whatever is there 
    logging.error('No appropriate activity load found for load %d per %s' % (publisherActivityLoad, self.activityDelta.name))
    return model.ActivityParams() #return default
  
  def getNumBuckets(self, publisherUrl):
    self.refreshActivities()
    activity = self.getActivityParamsForPublisherUrl_(publisherUrl)
    return activity.num_buckets
  
  def getSecondsSinceLastJob_(self, publisherUrl):
    lastTime = memcache.get('last_job_time_%s' % publisherUrl)
    if not lastTime:
      lastTime = 0
    now = time.time()
    return now - lastTime
    
  def updateJobEndTime_(self, publisherUrl):
    memcache.set('last_job_time_%s' % publisherUrl, time.time())
  
  # called by admin UI after update
  def refreshActivities(self):
    now = datetime.datetime.utcnow()
    refresh = False
    if now - self.lastLoad > self.timeToRefresh:
      refresh = True
    self.lazyLoad_(refresh)
  
  def initiateItemUpdateProcessing(self, publisherUrl):
    self.refreshActivities()
    numOfUpdates = memcache.incr('num_updates_%s' % publisherUrl, initial_value=0)
    workerAdded = memcache.get('worker_added_%s' % publisherUrl)
    activity = self.getActivityParamsForPublisherUrl_(publisherUrl)
    
    if workerAdded or numOfUpdates == 0:
      return
    secSinceLastJob = self.getSecondsSinceLastJob_(publisherUrl)
    if (numOfUpdates >= activity.total_updates_before_triggering and
      secSinceLastJob > activity.min_time_sec_between_jobs or
      secSinceLastJob > activity.max_time_sec_before_triggering):
        publisherActivityLoad = self.getPublisherActivityLoad_(publisherUrl)
        logging.info('publisher load for %s %d' % (publisherUrl, publisherActivityLoad))
        logging.info('activity: %s', activity)
        logging.info('initiating item update processing for %s', publisherUrl)  
        memcache.set('worker_added_%s' % publisherUrl, True)
        memcache.set('num_updates_%s' % publisherUrl, 0) #do not update until reset
        res = taskqueue.add(url='/process_item_updates', params={'publisherUrl': publisherUrl})
        logging.info(res)
        
  def finishItemUpdateProcessing(self, publisherSite): 
    self.updateJobEndTime_(publisherSite.publisherUrl)
    self.updatePublisherActivityLoad_(publisherSite)
    # reset number of updates
    memcache.set('num_updates_%s' % publisherSite.publisherUrl, 0)
    memcache.set('worker_added_%s' % publisherSite.publisherUrl, False)

activityManager = ActivityManager()