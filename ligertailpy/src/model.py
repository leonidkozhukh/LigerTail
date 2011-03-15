from google.appengine.api import memcache, users
from google.appengine.ext import db
from time import mktime
import datetime
import logging
import pickle
import calendar


# Set the debug level
_DEBUG = True

class StatType:
  BEGIN = 0
  UNIQUES = 0
  VIEWS = 1
  CLICKS = 2
  LIKES = 3
  CLOSES = 4
  END = 5
  UNKNOWN = 999
  
SEC = 1
MIN = SEC * 60
HOUR = MIN * 60
DAY = HOUR * 24

  
NUM_DELTAS = 20


class Duration:
  def __init__(self, name, id, num_items):
    self.name = name
    self.id = id
    self.num_items = num_items
    self.o = {}
    self.o['id'] = self.id
    self.o['num_items'] = self.num_items

YEARLY = Duration('yearly', 0, 3)
MONTHLY = Duration('monthly', 1, 12)
DAILY = Duration('daily', 2, 31)
HOURLY = Duration('hourly', 3, 24)
MINUTELY = Duration('minutely', 4, 60) 

DurationInfo = {YEARLY.id: YEARLY,
             MONTHLY.id: MONTHLY,
             DAILY.id: DAILY,
             HOURLY.id: HOURLY,
             MINUTELY.id: MINUTELY}
  
class Preference:
    RECENCY = 0
    POPULARITY = 1
    
class Filter(db.Model):
  recency = db.IntegerProperty(default=50)
  popularity = db.IntegerProperty(default=50)
  durationId = db.IntegerProperty(default=YEARLY.id)
  default = False

  def __str__(self):
    return 'recency: %d, popularity %d, duration %s' %(self.recency, self.popularity, DurationInfo[self.durationId].name)


  def update(self, durationId, popularity, recency):
    ''' Assumption: 0 is not a valid value for 
        duration, popularity and recency
    '''
    if durationId != self.durationId:
      self.durationId = int(durationId)
      self.default = False
    if popularity and popularity != self.popularity:
      self.popularity = int(popularity)
      self.default = False
    if recency and recency != self.recency:
      self.recency = int(recency)    
      self.default = False


class PaymentInfo:
  creationTime = {}
  email = ''
  price = 0
  
  def __init__(self, creationTime, price, email):
    self.email = email
    self.price = price
    self.creationTime = creationTime

  def __str__(self):
    return '%s $%d %s' %(self.creationTime, self.price, self.email)


class StatContainer(db.Model):
  pickled_stats = db.BlobProperty(required=False)
  pickled_timedstats = db.BlobProperty(required=False)
  stats = {}
  timedStats = {}

  def __str__(self):
    return 'total [uniques: %d, views: %d, clicks %d, likes %d, closes %d' % (self.stats[StatType.UNIQUES],
       self.stats[StatType.VIEWS],
       self.stats[StatType.CLICKS],
       self.stats[StatType.LIKES],
       self.stats[StatType.CLOSES])


  def initStats(self):
    if self.pickled_stats:
      (self.stats) = pickle.loads(self.pickled_stats)
      if not self.stats.has_key(StatType.CLICKS):
        self.stats[StatType.CLICKS] = 0
      if not self.stats.has_key(StatType.CLOSES):
        self.stats[StatType.CLOSES] = 0
      if not self.stats.has_key(StatType.LIKES):
        self.stats[StatType.LIKES] = 0
      if not self.stats.has_key(StatType.UNIQUES):
        self.stats[StatType.UNIQUES] = 0
      if not self.stats.has_key(StatType.VIEWS):
        self.stats[StatType.VIEWS] = 0
      
    else: 
      self.stats = {
                    StatType.CLICKS : 0,
                    StatType.CLOSES : 0,
                    StatType.LIKES : 0,
                    StatType.UNIQUES : 0,
                    StatType.VIEWS : 0
                  }
    if self.pickled_timedstats:
      (self.timedStats) = pickle.loads(self.pickled_timedstats)
    else:
      self.timedStats = TimedStats()

  def putPickledStats(self):
    self.pickled_stats = pickle.dumps((self.stats), 2)
    self.pickled_timedstats = pickle.dumps((self.timedStats), 2)

  def updateStats(self, statType, creationTime):
    if not self.stats.has_key(statType):
      self.stats[statType] = 1
    else:
      self.stats[statType] += 1
    self.timedStats.update(statType, creationTime)


class Item(StatContainer):
  creationTime = db.DateTimeProperty(auto_now_add=True)
  url = db.StringProperty()
  thumbnailUrl = db.StringProperty()
  title = db.StringProperty()
  description = db.TextProperty()
  price = db.IntegerProperty(default = 0)
  email = db.EmailProperty()
  publisherUrl = db.StringProperty()
  sessionId = db.StringProperty()  
  pickled_payments = db.BlobProperty(required=False)
  payments = []
  
  def __init__(self, *args, **kwargs):
    super(Item, self).__init__(*args, **kwargs)
    self.initStats()
    if self.pickled_payments:
      (self.payments) = pickle.loads(self.pickled_payments)

  def __str__(self):
    id = 0
    if self.key():
      id = self.key().id()
    return '''id: %d, title %s url %s
    publisherUrl %s
    payments %s
    stats %s''' %(id, self.title, self.url, self.publisherUrl, self.payments, self.stats)
    
    
  def put(self):
    '''Stores the object, making the derived fields consistent.'''
    # Pickle data
    self.putPickledStats()
    self.pickled_payments = pickle.dumps((self.payments), 2)
    db.Model.put(self)
           
   
  def updatePrice(self, price, email):
    # TODO: check for price > 0 and email valid
    paymentInfo = PaymentInfo(datetime.datetime.utcnow(),
                              price, email)
    self.payments.append(paymentInfo)
    # TODO: use more sophisticated price estimate
    self.price += price
  


class Spot(StatContainer):
  creationTime = db.DateTimeProperty(auto_now_add=True)
  spot = db.IntegerProperty()
  publisherUrl = db.StringProperty()
  
  def __init__(self, *args, **kwargs):
    super(Spot, self).__init__(*args, **kwargs)
    self.initStats()


  def __str__(self):
    return 'publisherUrl %s, spot %d, stats %s' %(self.publisherUrl, self.spot, self.stats)
    
  def put(self):
    '''Stores the object, making the derived fields consistent.'''
    # Pickle data
    self.putPickledStats()
    db.Model.put(self)


class PublisherSite(StatContainer):
  creationTime = db.DateTimeProperty(auto_now_add=True)
  publisherUrl = db.StringProperty()
  
  def __init__(self, *args, **kwargs):
    super(PublisherSite, self).__init__(*args, **kwargs)
    self.initStats()
  
  def __str__(self):
    return 'publisherUrl %s, stats %s' %(self.publisherUrl, self.stats)
    
  def put(self):
    '''Stores the object, making the derived fields consistent.'''
    # Pickle data
    self.putPickledStats()
    db.Model.put(self)



class TimedStats(object):
  def __init__(self):  
    self.durations = self.create_()
    self.updateTime = None

  def create_(self):
    durations = {}
    for durationId in range(YEARLY.id, MINUTELY.id+1):
      durations[durationId] = self.createStatArray_(DurationInfo[durationId].num_items)
    return durations
  
  def createStatArray_(self, num_deltas):
    stats = []
    for _ in range(0, num_deltas):
      stats.append(self.createEmptyStats_())
    return stats
  
  def createEmptyStats_(self):
    return {
            StatType.CLICKS : 0,
            StatType.CLOSES : 0,
            StatType.LIKES : 0,
            StatType.UNIQUES : 0,
            StatType.VIEWS : 0
          }

  def update(self, statType = StatType.UNKNOWN, updateTime = datetime.datetime.utcnow()):
    prevYear = prevMonth  = prevDay = prevHour = prevMinute = -1
    
    if self.updateTime:
      timedelta = updateTime - self.updateTime
      if updateTime.year - self.updateTime.year <= YEARLY.num_items:
        prevYear = updateTime.year - self.updateTime.year
      if updateTime.month >= self.updateTime.month and updateTime.year == self.updateTime.year:
        prevMonth = updateTime.month - self.updateTime.month
      elif updateTime.month < self.updateTime.month and updateTime.year - 1 == self.updateTime.year:
        prevMonth = updateTime.month + 12 - self.updateTime.month
      if updateTime.day >= self.updateTime.day and updateTime.month == self.updateTime.month and updateTime.year == self.updateTime.year:
        prevDay = updateTime.day - self.updateTime.day
      elif updateTime.day < self.updateTime.day and timedelta.days < 31:
        prevDay = updateTime.day + calendar.mdays[self.updateTime.month] - self.updateTime.day
      if updateTime.hour >= self.updateTime.hour and timedelta.days == 0:
        prevHour = updateTime.hour - self.updateTime.hour
      elif updateTime.hour < self.updateTime.hour and timedelta.days == 0:
        prevHour = updateTime.hour + 24 - self.updateTime.hour
      if updateTime.minute >= self.updateTime.minute and timedelta.days == 0 and timedelta.seconds < 3600 :
        prevMinute = updateTime.minute - self.updateTime.minute
      elif updateTime.minute < self.updateTime.minute and timedelta.days == 0 and timedelta.seconds < 3600:
        prevMinute = updateTime.minute + 60 - self.updateTime.minute
            
    self.updateStats_(YEARLY, statType, prevYear)
    self.updateStats_(MONTHLY, statType, prevMonth)
    self.updateStats_(DAILY, statType, prevDay)
    self.updateStats_(HOURLY, statType, prevHour)
    self.updateStats_(MINUTELY, statType, prevMinute)
    self.updateTime = updateTime
    return self.durations

  def updateStats_(self, duration, statType, previousTimeBucket):  
    recordedStats = self.durations[duration.id]
    statArray = []
    i = 0
    if previousTimeBucket == -1:
      previousTimeBucket = duration.num_items #clear out the array      
    if previousTimeBucket > 0:
      i = 0
      while previousTimeBucket > 0 and i < duration.num_items:
        statArray.append(self.createEmptyStats_())
        previousTimeBucket -= 1
        i += 1
      j = 0
      while i < duration.num_items:
        statArray.append(recordedStats[j])
        i += 1
        j += 1
      if statType != StatType.UNKNOWN:
        statArray[0][statType] = statArray[0][statType] + 1
      self.durations[duration.id] = statArray
    elif statType != StatType.UNKNOWN: 
      recordedStats[0][statType] = recordedStats[0][statType] + 1
    
class ItemUpdateEntity(object):  
  itemId = None
  bNew = False
  statType = None
  spot = 0
  creationTime = None
  
  def __init__(self, itemId, bNew, statType, spot):
    self.itemId = itemId
    self.bNew = bNew
    self.statType = statType
    self.spot = spot
    self.creationTime = datetime.datetime.utcnow()

  def __str__(self):
    new = ''
    if self.bNew:
      new = 'New,'
    return 'itemId %d, %s, statType: %s, spot %d' %(self.itemId, new, self.statType, self.spot)


class Bucket(db.Model):
  pickled_entities = db.BlobProperty()
  bucketId = db.StringProperty()
  entities = []
  
  def __init__(self, *args, **kwargs):
    super(Bucket, self).__init__(*args, **kwargs)
    if self.pickled_entities:
      (self.entities) = pickle.loads(self.pickled_entities)
    else: 
      self.entities = []

  def __str__(self):
    return 'bucketId %s, numItems: %d' %(self.bucketId, len(self.entities))


  def put(self):
    # Pickle data
    self.pickled_entities = pickle.dumps((self.entities), 2)
    db.Model.put(self)


class Viewer(db.Model):
    isNew = False
    creationTime = db.DateTimeProperty(auto_now_add=True)
    sessionId = db.StringProperty()
    likes = db.ListProperty(int)
    closes = db.ListProperty(int)
    pickled_filter = db.BlobProperty(required = False)
    filter = {}
  
    def __init__(self, *args, **kwargs):
      super(Viewer, self).__init__(*args, **kwargs)
      if self.pickled_filter:
        (self.filter) = pickle.loads(self.pickled_filter)
      else: 
        self.filter = getDefaultFilter()
  
    def __str__(self):
      new = ''
      if self.isNew:
        new = 'New'
      return 'session %s %s, likes %s, closes %s, filter %s ' %(self.sessionId, new, self.likes, self.closes, self.filter)

    def put(self):
      if not self.filter.default:
        '''Stores the object, making the derived fields consistent.'''
        # Pickle data
        self.pickled_filter = pickle.dumps((self.filter), 2)
        db.Model.put(self)

class OrderingAlgorithmParams(db.Model):
  name = db.StringProperty(default = 'default')
  likes_factor = db.FloatProperty(default=500.0)
  clicks_factor = db.FloatProperty(default=100.0)
  closes_factor = db.FloatProperty(default = -20.0)
  total_likes_factor = db.FloatProperty(default = 1.0)
  total_clicks_factor = db.FloatProperty(default = 1.0)
  total_closes_factor = db.FloatProperty(default = -1.0)
  total_views_factor = db.FloatProperty(default = -0.2)
  recency_factor = db.FloatProperty(default = 1000.0)
  price_factor = db.FloatProperty(default = 1000.0)

  #TODO: add more details once alg params are flashed out
  def __str__(self):
    return '%s' % self.name

  def update(self, likes, clicks, closes,
             total_likes, total_clicks, total_closes, total_views,
             recency, price):
    self.likes_factor = float(likes)
    self.clicks_factor = float(clicks)
    self.closes_factor = float(closes)
    self.total_likes_factor = float(total_likes)
    self.total_clicks_factor = float(total_clicks)
    self.total_closes_factor = float(total_closes)
    self.total_views_factor = float(total_views)
    self.recency_factor = float(recency)
    self.price_factor = float(price)
    self.put()

class ActivityParams(db.Model):
  activity_load = db.IntegerProperty(default = 10000000) # number of interactions per time unit
  name = db.StringProperty(default = 'default')
  num_buckets = db.IntegerProperty(default = 1)
  total_updates_before_triggering = db.IntegerProperty(default=20)
  enabled = db.BooleanProperty(default = True)
  min_time_sec_between_jobs = db.IntegerProperty(default = 0)
  max_time_sec_before_triggering = db.IntegerProperty(default = 60)
  index = 0 #used for templates
  
  def __str__(self):
    enabled = 'DISABLED'
    if self.enabled:
      enabled = 'enabled'
    
    return '''
      name %s, activity_load/hr: %d %s
      num_buckets %d
      total updates before triggering: %d
      min_time_sec %d, max_time_sec %d''', (self.name, self.activity_load, enabled,
      self.num_buckets, self.total_updates_before_triggering,
      self.min_time_sec_between_jobs, self.max_time_sec_before_triggering)
  
  def update(self, activity, name, numBuckets, totalUpdates, enabled, minTime, maxTime):
    self.activity_load = activity
    self.name = name
    self.num_buckets = numBuckets
    self.total_updates_before_triggering = totalUpdates
    self.enabled = enabled
    self.min_time_sec_between_jobs = minTime
    self.max_time_sec_before_triggering = maxTime
    
  def getErrors(self):
    er = ''
    if not self.name:
      er += '|name empty'
    if self.activity_load <= 0:
      er += '|load <= 0'
    if self.num_buckets <= 0:
      er += '|buckets <= 0'
    if self.total_updates_before_triggering <= 0:
      er += '|updates <= 0'
    if self.min_time_sec_between_jobs < 0:
      er += '|mintime < 0'
    if self.max_time_sec_before_triggering <= self.min_time_sec_between_jobs:
      er += '|maxtime <= mintime'
    return er
  
  def updateFrom(self, other):
    updated = False
    if other.getErrors() == '' and self.name == other.name:
      if self.activity_load != other.activity_load:
        updated = True
        self.activity_load = other.activity_load
      if self.num_buckets != other.num_buckets:
        updated = True
        self.num_buckets = other.num_buckets
      if self.total_updates_before_triggering != other.total_updates_before_triggering:
        updated = True
        self.total_updates_before_triggering = other.total_updates_before_triggering 
      if self.enabled != other.enabled:
        updated = True
        self.enabled = other.enabled
      if self.min_time_sec_between_jobs != other.min_time_sec_between_jobs:
        updated = True
        self.min_time_sec_between_jobs = other.min_time_sec_between_jobs
      if self.max_time_sec_before_triggering != other.max_time_sec_before_triggering:
        updated = True
        self.max_time_sec_before_triggering = other.max_time_sec_before_triggering
    return updated    


     
def getItems(publisherUrl):
    return db.GqlQuery("SELECT * FROM Item WHERE publisherUrl=:1", publisherUrl).fetch(1000);

def getPaidItems(publisherUrl):
    return db.GqlQuery('SELECT * FROM Item WHERE publisherUrl=:1 AND price > 0 ORDER BY price DESC', publisherUrl).fetch(1000);

def getSpot(publisherUrl, pos):
    spot = None
    if pos:
      spot = db.GqlQuery('SELECT * FROM Spot WHERE publisherUrl=:1 AND spot=:2', publisherUrl, int(pos)).get()
    if not spot:
      spot = Spot()
      spot.publisherUrl = publisherUrl
      spot.spot = pos
    return spot

def getViewer(sessionId):
    viewer = db.GqlQuery('SELECT * FROM Viewer WHERE sessionId=:1', sessionId).get()
    if (viewer):
        logging.info('Found viewer for session ' + sessionId)
        if (not viewer.filter):
            viewer.filter = getDefaultFilter()
    else:
        viewer = Viewer()
        viewer.sessionId = sessionId
        viewer.isNew = True
        viewer.put()
        viewer.filter = getDefaultFilter()
    return viewer

def getPublisherSite(publisherUrl):
    publisher = db.GqlQuery('SELECT * FROM PublisherSite WHERE publisherUrl=:1', publisherUrl).get()
    if not publisher:
      publisher = PublisherSite()
      publisher.publisherUrl = publisherUrl
      publisher.put()
    return publisher

def getBucket(bucketId):
  bucket = db.GqlQuery('SELECT * FROM Bucket WHERE bucketId=:1', bucketId).get()
  if not bucket:
    bucket = Bucket()
    bucket.bucketId = bucketId
    bucket.put()
  return bucket

DEFAULT_FILTER_ = Filter()
DEFAULT_FILTER_.default = True

def getDefaultFilter():
    return DEFAULT_FILTER_


def getOrderingAlgorithmParams(id):
    params = db.GqlQuery('SELECT * FROM OrderingAlgorithmParams WHERE name=:1', id).get()
    if (params):
      logging.info('Found ordering algorithm params for id %s' % id)
    else:
      logging.info('Did not find ordering alg params for id %s. Creating' % id)
      params = OrderingAlgorithmParams()
      params.name = id
      params.put()
    return params


def getActivities(enabled):
  query = ''
  if enabled:
    query = 'SELECT * FROM ActivityParams WHERE enabled = TRUE ORDER BY activity'
  else:
    query = 'SELECT * FROM ActivityParams ORDER BY activity'
  
  activities = db.GqlQuery(query).fetch(100);
  if not len(activities):
      activity = ActivityParams() #default
      activity.put()
      activities = [activity]
  return activities
