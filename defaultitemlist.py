import model
import logging
import time
import random
from itemlist import itemList
from activitymanager import Singleton
 

  
class DefaultItemList(Singleton):
  def __init__(self):
    self.config = None
    self.lastLoad = time.time()
    self.secToRefresh = 120
    
  def lazyLoad(self):
    now = time.time()
    refresh = False
    if now - self.lastLoad > self.secToRefresh:
      refresh = True
    if not self.config or refresh:
      self.lastLoad = time.time()
      self.config = model.getDefaultLinksConfig()
      self.secToRefresh = self.config.refresh_period_sec
      if self.secToRefresh < 10:
        self.secToRefresh = 10
      logging.info('Reloading defaultlinks')

  def getOrderedItems(self):
    self.lazyLoad()
    if self.config.enable and len(self.config.default_links_url) and not self.disallowOutgoing():
      return itemList.getDefaultOrderedItems(self.config.default_links_url);
    return []

  def getPublisherUrl(self):
    self.lazyLoad()
    return self.config.default_links_url

  def disallowIncoming(self):
    self.lazyLoad()
    return not self.config.throttle_outgoing and self.config.throttle < random.randint(0, 100)

  def disallowOutgoing(self):
    self.lazyLoad()
    return self.config.throttle_outgoing and self.config.throttle < random.randint(0, 100)

defaultItemList = DefaultItemList()
  
    
