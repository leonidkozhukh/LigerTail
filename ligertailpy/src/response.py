from appengine_utilities.sessions import Session
from django.utils import simplejson as json
from google.appengine.api import memcache, users
import datetime
import model

# Set the debug level
_DEBUG = True

class ItemInfo(object):
    SHORT = 0
    WITH_PRICE = 1
    FULL = 2

class ResponseStats(json.JSONEncoder):
  def initStatsFrom(self, statsContainer):
    self.stats = statsContainer.stats
    self.timedStats = statsContainer.timedStats

  def populateStats(self, ret):
    total = {}
    for i in range (model.StatType.BEGIN, model.StatType.END):
      total[i] = self.stats[i]
    ret['totalStats'] = total
    ret['timedStats'] = self.timedStats.update()
    d = self.timedStats.updateTime
    ret['updateTime'] = {'year' : d.year,
                         'month' : d.month,
                         'day' : d.day,
                         'hour' : d.hour,
                         'minute' : d.minute }

class ResponseItem(ResponseStats):
    def initFrom(self, item, itemInfo):
        self.id = item.key().id()
        self.url = item.url
        self.thumbnailUrl = item.thumbnailUrl
        self.title = item.title
        self.description = item.description
        self.itemInfo = itemInfo
        self.price = item.price
        self.publisherUrl = item.publisherUrl
        if hasattr(item, 'engagement'):
          self.engagement = item.engagement
        if hasattr(item, 'tier'):
          self.tier = item.tier
        self.initStatsFrom(item)
        #email
        #sessionId


    def default(self, o):
      if isinstance(o, ResponseItem):
          ret = {'url' : o.url,
              'title' : o.title,
              'description' : o.description,
              'id' : o.id,
              'thumbnailUrl' : o.thumbnailUrl,
              'publisherUrl' : o.publisherUrl
              }
          if o.itemInfo == ItemInfo.WITH_PRICE or o.itemInfo == ItemInfo.FULL:
              ret['price'] = o.price
              if hasattr(o, 'engagement'):
                ret['engagement'] = o.engagement
              if hasattr(o, 'tier'):
                ret['tier'] = o.tier
          if o.itemInfo == ItemInfo.FULL:
              o.populateStats(ret)
          return ret
      return json.JSONEncoder.default(self, o)


class ResponseSpot(ResponseStats):
    def initFrom(self, spot):
        self.spot = spot.spot
        self.publisherUrl = spot.publisherUrl
        self.initStatsFrom(spot)
        
    def default(self, o):
      if isinstance(o, ResponseSpot):
          ret = {'publisherUrl' : o.publisherUrl, 'spot': o.spot}
          o.populateStats(ret)
          return ret
      return json.JSONEncoder.default(self, o)

class ResponsePublisherSite(ResponseStats):
    def initFrom(self, publisher):
        self.publisherUrl = publisher.publisherUrl
        self.initStatsFrom(publisher)
        
    def default(self, o):
      if isinstance(o, ResponsePublisherSite):
          ret = {'publisherUrl' : o.publisherUrl}
          o.populateStats(ret)
          return ret
      return json.JSONEncoder.default(self, o)


class ResponseFilter(json.JSONEncoder):
    def initFrom(self, filter):
        self.durationId = filter.durationId
        self.recency = filter.recency
        self.popularity = filter.popularity
        
    def default(self, o):
      if isinstance(o, ResponseFilter):
          ret = {'durationId' : o.durationId,
              'recency' : o.recency,
              'popularity' : o.popularity,
              }
          return ret
      return json.JSONEncoder.default(self, o)

class CommonResponse(json.JSONEncoder):
  def set_error(self, s):
    self.status = "error"
    self.error = s
    
  def reset(self):
    self.items = []
    self.spots = []
    self.publisherSites = []
    self.sessionId = None
    self.filter = {}
    self.status = "ok"
    self.error = ""

  def default(self, o):
      if isinstance(o, CommonResponse):
          return {"items" : o.items,
                  "spots" : o.spots,
                  "publisherSites" : o.publisherSites,
                  "filter" : o.filter,
                  "status" : o.status,
                  "error" : o.error
                  }
      elif isinstance(o, ResponseItem):
          return json.dumps(o, cls=ResponseItem)
      elif isinstance(o, ResponseSpot):
          return json.dumps(o, cls=ResponseSpot)
      elif isinstance(o, ResponsePublisherSite):
          return json.dumps(o, cls=ResponsePublisherSite)
      elif isinstance(o, ResponseFilter):
          return json.dumps(o, cls=ResponseFilter) 
      else:
          return json.JSONEncoder.default(self, o)
     
  def setItems(self, items, itemInfo):
    for item in items:
      ri = ResponseItem()
      ri.initFrom(item, itemInfo)
      self.items.append(ri)
  
  def setSpots(self, spots):
    for spot in spots:
      rs = ResponseSpot()
      rs.initFrom(spot)
      self.spots.append(rs)
      
  def setPublisherSites(self, publisherSites):
    for publisherSite in publisherSites:
      rp = ResponsePublisherSite()
      rp.initFrom(publisherSite)
      self.publisherSites.append(rp)
    
  def setFilter(self, filter):
    self.filter = ResponseFilter()
    self.filter.initFrom(filter)
    