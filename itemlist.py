import model
import re
import logging
from filterstrategy import filterStrategy
from google.appengine.ext import db
from google.appengine.api import memcache
from google.appengine.api import taskqueue
from activitymanager import activityManager
from activitymanager import Singleton
from google.appengine.ext import deferred
import copy
import time
  
class ItemList(Singleton):
  
  def doUpdateItem_(self, publisherUrl, itemId, statType):       
    key = self.getItemKey_(itemId)
    itemUpdate = memcache.get(key)
    if not itemUpdate:
      itemUpdate = model.ItemUpdate(itemId)
    itemUpdate.update(statType)
    memcache.set(key, itemUpdate)

    if activityManager.itemNeedsNewJob(publisherUrl, itemUpdate):
      task_name = '-'.join([key, time.strftime("%W-%w-%H-%M", time.gmtime())])
      try:
        deferred.defer(self.flushItemUpdate, itemId, _name=task_name)
      except (taskqueue.TaskAlreadyExistsError, taskqueue.TombstonedTaskError):
        pass

  def doUpdateSpot_(self, publisherUrl, spot, statType):     
    key = self.getSpotKey_(publisherUrl, spot)
    spotUpdate = memcache.get(key)                          
    if not spotUpdate:
      spotUpdate = model.SpotUpdate(publisherUrl, spot)
    spotUpdate.update(statType)
    memcache.set(key, spotUpdate)

    if activityManager.spotNeedsNewJob(spotUpdate):
      task_name = '-'.join([key, time.strftime("%W-%w-%H-%M", time.gmtime())])
      try:
        deferred.defer(self.flushSpotUpdate, publisherUrl, spot, _name=task_name)
      except (taskqueue.TaskAlreadyExistsError, taskqueue.TombstonedTaskError):
        pass

  def doUpdatePublisherSite_(self, publisherUrl, statType):       
    key = self.getPublisherSiteKey_(publisherUrl)
    publisherSiteUpdate = memcache.get(key)
    if not publisherSiteUpdate:
      publisherSiteUpdate = model.PublisherSiteUpdate(publisherUrl)
    publisherSiteUpdate.update(statType)
    memcache.set(key, publisherSiteUpdate)

    if activityManager.publisherSiteNeedsNewJob(publisherSiteUpdate):
      task_name = '-'.join([key, time.strftime("%W-%w-%H-%M", time.gmtime())])
      try:
        deferred.defer(self.flushPublisherSiteUpdate, publisherUrl, _name=task_name)
      except (taskqueue.TaskAlreadyExistsError, taskqueue.TombstonedTaskError):
        pass

  
  @classmethod
  def getItemKey_(cls, itemId):
      return re.sub(r'[^a-zA-Z\d]', '', '_'.join(['itemUpdate', str(itemId)]))

  @classmethod
  def getSpotKey_(cls, publisherUrl, spot):
      return re.sub(r'[^a-zA-Z\d]', '', '_'.join(['spotUpdate', publisherUrl, str(spot)]))

  @classmethod
  def getPublisherSiteKey_(cls, publisherUrl):
      return re.sub(r'[^a-zA-Z\d]', '', '_'.join(['publisherSiteUpdate', publisherUrl]))
    
  #TODO: remove bNew
  def updateItem(self, publisherUrl, itemId, item, bNew, statType, spot):
    if itemId > 0:
      self.doUpdateItem_(publisherUrl, itemId, statType)
    self.doUpdateSpot_(publisherUrl, spot, statType)
    self.doUpdatePublisherSite_(publisherUrl, statType)

  @classmethod  
  def flushItemUpdate(cls, itemId):
    key = cls.getItemKey_(itemId)
    updated = memcache.get(key)
    if updated:
      item = model.Item.get_by_id(itemId)
      clone = copy.deepcopy(updated)
      updated.reset(clone)
      # reset counters as soon as possible and write into memcache
      memcache.set(key, updated)
      item.updateStats(clone)
      item.put()
      
  @classmethod        
  def flushSpotUpdate(cls, publisherUrl, spotPosition):
    key = cls.getSpotKey_(publisherUrl, spotPosition)
    updated = memcache.get(key)
    if updated:
      spot = model.getSpot(publisherUrl, spotPosition)
      clone = copy.deepcopy(updated)
      updated.reset(clone)
      # reset counters as soon as possible and write into memcache
      memcache.set(key, updated)
      spot.updateStats(clone)
      spot.put()

  @classmethod
  def flushPublisherSiteUpdate(cls, publisherUrl):
    key = cls.getPublisherSiteKey_(publisherUrl)
    updated = memcache.get(key)
    if updated:
      publisherSite = model.getPublisherSite(publisherUrl)
      clone = copy.deepcopy(updated)
      updated.reset(clone)
      # reset counters as soon as possible and write into memcache
      memcache.set(key, updated)
      publisherSite.updateStats(clone)
      publisherSite.put()    
      if activityManager.needsToRefreshDefaultOrderedItems(clone): 
        cls.refreshCacheForDefaultOrderedItems(publisherUrl)   

      
  def getDefaultOrderedItems(self, publisherUrl):
    logging.info('getDefaultOrderedItems')
    defaultOrderedItems = memcache.get('def_list_%s' % publisherUrl)
    if defaultOrderedItems is not None:
      return defaultOrderedItems
    return self.refreshCacheForDefaultOrderedItems(publisherUrl)

  @classmethod
  def refreshCacheForDefaultOrderedItems(self, publisherUrl):   
    items = model.getItems(publisherUrl)
    defaultOrderedItems = filterStrategy.applyFilter(items.run(batch_size=1000), model.getDefaultFilter())
    logging.info('repopulating memache for %s', publisherUrl)
    memcache.set('def_list_%s' % publisherUrl, defaultOrderedItems[0:50])
    return defaultOrderedItems
    
itemList = ItemList()
