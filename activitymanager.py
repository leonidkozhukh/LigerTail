import model
import logging
import time
import datetime
from google.appengine.ext import db
from google.appengine.api import memcache
from google.appengine.api import taskqueue
from model import ActivityTypes
 
class Singleton(object):
  """ A Pythonic Singleton """
  def __new__(cls, *args, **kwargs):
    if '_inst' not in vars(cls):
      cls._inst = object.__new__(cls, *args, **kwargs)
    return cls._inst
  


class ActivityManager(Singleton):
  
  def __init__(self):
    self.activities = []
    self.lastLoad = time.time()
    self.publisherActivityLoadMap = {}
    self.publisherActivityLoadUpdateMap = {}
    # TODO be able to update via UI
    self.secToRefresh = 120
    self.numDeltasInThePast = 4
    self.activityDelta = model.MINUTELY
    self.averageOf = 2
    self.secToRefreshPublisherLoad = 60
    
  
#######
  def itemNeedsNewJob(self, publisherUrl, itemUpdate):
    return self.statsNeedsNewJob_(itemUpdate, publisherUrl, ActivityTypes.ITEM)
  
  def spotNeedsNewJob(self, spotUpdate):
    return self.statsNeedsNewJob_(spotUpdate, spotUpdate.publisherUrl, ActivityTypes.SPOT)

  def publisherSiteNeedsNewJob(self, publisherSiteUpdate):
    return self.statsNeedsNewJob_(publisherSiteUpdate, publisherSiteUpdate.publisherUrl, ActivityTypes.PUBLISHER_SITE)

  def needsToRefreshDefaultOrderedItems(self, publisherSiteUpdate):
    return self.statsNeedsNewJob_(publisherSiteUpdate, publisherSiteUpdate.publisherUrl, ActivityTypes.REFRESH_DEFAULT_ITEMS)

  def statsNeedsNewJob_(self, statsUpdate, publisherUrl, type):
    self.refreshActivities()
    activity = self.getActivityParamsForPublisherUrl_(publisherUrl)
    now = time.time()
    if statsUpdate.firstUpdateTime and statsUpdate.totalUpdates:
      return (now - statsUpdate.firstUpdateTime > activity.threshold_time_sec[type] or
        statsUpdate.totalUpdates > activity.threshold_total[type])
    return False  
          
  
  def getActivityPeriod(self):
    return self.activityDelta.name
  
  def lazyLoad_(self, refresh):
    if not len(self.activities) or refresh:
      self.lastLoad = time.time()
      self.activities = model.getActivities(True)
      logging.info('Reloading %d activities' % len(self.activities))

  def getPublisherActivityLoad_(self, publisherUrl):
    needRefresh = False
    if self.publisherActivityLoadUpdateMap.has_key(publisherUrl):
      lastUpdate = self.publisherActivityLoadUpdateMap[publisherUrl]
      now = time.time()
      if now - lastUpdate > self.secToRefreshPublisherLoad:
        needRefresh = True
    if needRefresh or not self.publisherActivityLoadMap.has_key(publisherUrl):
      publisherSite = model.getPublisherSite(publisherUrl)
      self.updatePublisherActivityLoad_(publisherSite)
    return self.publisherActivityLoadMap[publisherUrl]

  def updatePublisherActivityLoad_(self, publisherSite):        
    activityLoad = 0
    for i in range(0, self.averageOf):
      activityLoad += publisherSite.timedStats.durations[self.activityDelta.id][self.numDeltasInThePast - i][model.StatType.VIEWS]
    activityLoad /= self.averageOf
    logging.info('current activity load %d' % activityLoad)
    self.publisherActivityLoadMap[publisherSite.publisherUrl] = activityLoad
    self.publisherActivityLoadUpdateMap[publisherSite.publisherUrl] = time.time()

  def getActivityParamsForPublisherUrl_(self, publisherUrl):
    publisherActivityLoad = self.getPublisherActivityLoad_(publisherUrl)
    for activity in self.activities:
      if publisherActivityLoad <= activity.activity_load:
        return activity
    # No match found, return whatever is there 
    logging.error('No appropriate activity load found for load %d per %s' % (publisherActivityLoad, self.activityDelta.name))
    return model.ActivityParams() #return default
    
  # called by admin UI after update
  def refreshActivities(self):
    now = time.time()
    refresh = False
    if now - self.lastLoad > self.secToRefresh:
      refresh = True
    self.lazyLoad_(refresh)
  

activityManager = ActivityManager()
