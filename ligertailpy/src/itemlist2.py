import model
import re
import logging
from filterstrategy import filterStrategy
from google.appengine.ext import db
from google.appengine.api import memcache
from google.appengine.api import taskqueue
from activitymanager2 import activityManager2
from activitymanager2 import Singleton
from google.appengine.ext import deferred
  
class ItemList2(Singleton):
  
  def doUpdateItem_(self, publisherUrl, itemId, statType):       
    key = self.getItemKey_(itemId)
    itemUpdate = memcache.get(key)
    if not itemUpdate:
      itemUpdate = model.ItemUpdate(itemId)
    itemUpdate.update(statType)
    memcache.set(key, itemUpdate)

    if activityManager2.itemNeedsNewJob(publisherUrl, itemUpdate):
      try:
        deferred.defer(self.flushItemUpdate, itemId, _name=key)
      except (taskqueue.TaskAlreadyExistsError, taskqueue.TombstonedTaskError):
        pass

  def doUpdateSpot_(self, publisherUrl, spot, statType):     
    key = self.getSpotKey_(publisherUrl, spot)
    spotUpdate = memcache.get(key)                          
    if not spotUpdate:
      spotUpdate = model.SpotUpdate(publisherUrl, spot)
    spotUpdate.update(statType)
    memcache.set(key, spotUpdate)

    if activityManager2.spotNeedsNewJob(spotUpdate):
      try:
        deferred.defer(self.flushSpotUpdate, publisherUrl, spot, _name=key)
      except (taskqueue.TaskAlreadyExistsError, taskqueue.TombstonedTaskError):
        pass

  def doUpdatePublisherSite_(self, publisherUrl, statType):       
    key = self.getPublisherSiteKey_(publisherUrl)
    publisherSiteUpdate = memcache.get(key)
    if not publisherSiteUpdate:
      publisherSiteUpdate = model.PublisherSiteUpdate(publisherUrl)
    publisherSiteUpdate.update(statType)
    memcache.set(key, publisherSiteUpdate)

    if activityManager2.publisherSiteNeedsNewJob(publisherSiteUpdate):
      try:
        deferred.defer(self.flushPublisherSiteUpdate, publisherUrl, _name=key)
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
    self.doUpdateItem_(publisherUrl, itemId, statType)
    self.doUpdateSpot_(publisherUrl, spot, statType)
    self.doUpdatePublisherSite_(publisherUrl, statType)

  @classmethod  
  def flushItemUpdate(cls, itemId):
    key = cls.getItemKey_(itemId)
    updated = memcache.get(key)
    if updated:
      item = model.Item.get_by_id(itemId)
      clone = updated.clone()
      updated.reset(clone)
      # reset counters as soon as possible and write into memcache
      memcache.set(key, updated)
      item.updateStats2(clone)
      item.put()
      
  @classmethod        
  def flushSpotUpdate(cls, publisherUrl, spotPosition):
    key = cls.getSpotKey_(publisherUrl, spotPosition)
    updated = memcache.get(key)
    if updated:
      spot = model.getSpot(publisherUrl, spotPosition)
      clone = updated.clone()
      updated.reset()
      # reset counters as soon as possible and write into memcache
      memcache.set(key, updated)
      spot.updateStats2(clone)
      spot.put()

  @classmethod
  def flushPublisherSiteUpdate(cls, publisherUrl):
    key = cls.getPublisherSiteKey_(publisherUrl)
    updated = memcache.get(key)
    if updated:
      publisherSite = model.getPublisherSite(publisherUrl)
      clone = updated.clone()
      updated.reset()
      # reset counters as soon as possible and write into memcache
      memcache.set(key, updated)
      publisherSite.updateStats2(clone)
      publisherSite.put()    
      if activityManager2.needsToRefreshDefaultOrderedItems(clone): 
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
    defaultOrderedItems = filterStrategy.applyFilter(items, model.getDefaultFilter())
    logging.info('repopulating memache for %s', publisherUrl)
    memcache.set('def_list_%s' % publisherUrl, defaultOrderedItems[0:50])
    return defaultOrderedItems
    
itemList2 = ItemList2()
