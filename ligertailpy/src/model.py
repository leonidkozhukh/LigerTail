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
  views = db.IntegerProperty(default = 0)
  amount = db.IntegerProperty(default = 0)
  
  def __init__(self, *args, **kwargs):
    super(PublisherSite, self).__init__(*args, **kwargs)
    self.initStats()
  
  def __str__(self):
    return 'publisherUrl %s, stats %s' %(self.publisherUrl, self.stats)

  def updateStats(self, statType, creationTime):
    StatContainer.updateStats(self, statType, creationTime)
    self.views = self.stats[StatType.VIEWS]
  
    
  def put(self):
    '''Stores the object, making the derived fields consistent.'''
    # Pickle data
    self.putPickledStats()
    db.Model.put(self)



class TimedStats(object):
  def __init__(self):  
    self.durations = self.create_()
    self.updateTime = None

  def getCompressed(self):  
    compressed = {}
    for durationId in range(YEARLY.id, MINUTELY.id+1):
      compressed[durationId] = self.getCompressedForDuration_(durationId)
    return compressed
    
  def getCompressedForDuration_(self, durationId):
    d = []
    for delta in self.durations[durationId]:
      a = {}
      for st in range (StatType.BEGIN, StatType.END):
        if delta[st] > 0:
          a[st] = delta[st];
      d.append(a)
    return d 
  
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

  def getPrevYear_(self, updateTime):
    prevYear = -1
    if updateTime.year - self.updateTime.year <= YEARLY.num_items:
      prevYear = updateTime.year - self.updateTime.year
    return prevYear
  
  def getPrevMonth_(self, updateTime):
    prevMonth = -1
    if updateTime.month >= self.updateTime.month and updateTime.year == self.updateTime.year:
      prevMonth = updateTime.month - self.updateTime.month
    elif updateTime.month < self.updateTime.month and updateTime.year - 1 == self.updateTime.year:
      prevMonth = updateTime.month + 12 - self.updateTime.month
    return prevMonth
  
  def getPrevDay_(self, updateTime):
    timedelta = updateTime - self.updateTime
    prevDay = -1
    if updateTime.day >= self.updateTime.day and updateTime.month == self.updateTime.month and updateTime.year == self.updateTime.year:
      prevDay = updateTime.day - self.updateTime.day
    elif updateTime.day < self.updateTime.day and timedelta.days < 31:
      prevDay = updateTime.day + calendar.mdays[self.updateTime.month] - self.updateTime.day
    return prevDay

  def getPrevHour_(self, updateTime):
    timedelta = updateTime - self.updateTime
    prevHour = -1
    if updateTime.hour >= self.updateTime.hour and timedelta.days == 0:
      prevHour = updateTime.hour - self.updateTime.hour
    elif updateTime.hour < self.updateTime.hour and timedelta.days == 0:
      prevHour = updateTime.hour + 24 - self.updateTime.hour
    return prevHour

  def getPrevMinute_(self, updateTime):
    timedelta = updateTime - self.updateTime
    prevMinute = -1          
    if updateTime.minute >= self.updateTime.minute and timedelta.days == 0 and timedelta.seconds < 3600 :
      prevMinute = updateTime.minute - self.updateTime.minute
    elif updateTime.minute < self.updateTime.minute and timedelta.days == 0 and timedelta.seconds < 3600:
      prevMinute = updateTime.minute + 60 - self.updateTime.minute
    return prevMinute

  def update(self, statType = StatType.UNKNOWN, updateTime = datetime.datetime.utcnow()):
    prevYear = prevMonth = prevDay = prevHour = prevMinute = -1
    
    if self.updateTime:
      prevYear = self.getPrevYear_(updateTime);
      prevMonth = self.getPrevMonth_(updateTime);
      prevDay = self.getPrevDay_(updateTime);
      prevHour = self.getPrevHour_(updateTime);
      prevMinute = self.getPrevMinute_(updateTime);
            
    self.updateStats_(YEARLY, statType, prevYear)
    self.updateStats_(MONTHLY, statType, prevMonth)
    self.updateStats_(DAILY, statType, prevDay)
    self.updateStats_(HOURLY, statType, prevHour)
    self.updateStats_(MINUTELY, statType, prevMinute)
    self.updateTime = updateTime
    return self.getCompressed()

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
    
  def getStats(self, statType, durationType, numOfDeltas):
    now = datetime.datetime.utcnow();
    
  
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

class PaymentConfig(db.Model):
  send_email = db.BooleanProperty(default=False)
  test_mode = db.BooleanProperty(default=True)


# The ordering algorithm is calculated the following way:
# Tier 0 - priced items. All items that are paid for with number of views < num_views_threshold.
# This gives top priority to the items that are paid for, to acquire necessary stats
#
# Tier 1 - quality content. These are items whose stats are known (views > num_views_threshold)
# and whose engagement is high (clicks + closes)/views.
# The engagement is a value 0..1 (1 being the highest, when every view results in
# a user action)
# The engagement rate is calculated (ctr - click through rate, clr - close rate):
# ctr * ctr_factor + clr * (1 - ctr_factor)
# 
# Tier 2 - better than ads. Disregarding the number of views, just high enough engagement
# factor. (tier2_engagement_threshold < item engagement < tier1_engagement_threshold)
#
# Tier 3 - questionable pool. All other items who don't have enough stats, with the 
# priority given to fewer views. This gives a chance to all items to be shown.
# 
# Tier 2 and Tier 3 are interleaved with the ratio tier2_tier3_ratio

class OrderingAlgorithmParams(db.Model):
  # 0 .. 1.0
  # The absolute engagement (1.0) is when on every view an item is interacted with
  # (either clicked or closed to see the other items)
  tier1_engagement_threshold = db.FloatProperty(default=0.3)
  
  # 0 .. tier1_engagement_threshold
  tier2_engagement_threshold = db.FloatProperty(default=0.1)
  
  # Number of views that is enough to make a reasonable estimate about
  # how well the item is doing
  num_views_threshold = db.IntegerProperty(default=50)
  
  # 0..1. The higher ctr_factor, the less important closes rate (clr) is
  # since clr is multiplied by (1-ctr_factor)
  ctr_factor = db.FloatProperty(default = 0.7)

  # Defines a proportion of tier2 over tier3
  # eg, 0.7 - 70% is for tier2, 30% for tier3
  tier2_tier3_ratio = db.FloatProperty(default=0.51)

  #TODO: add more details once alg params are flashed out
  def __str__(self):
    return 'tier1: %f, tier2: %f, num_views: %d, ctr_f: %f, tier2/tier3: %f' % (
       self.tier1_engagement_threshold, self.tier2_engagement_threshold,
       self.num_views_threshold, self.ctr_factor, self.tier2_tier3_ratio)

  def update(self, t1_eng, t2_eng, num_views, ctr_f, t2_t3_ratio):
    er = ''
    if t1_eng <= 0 or t1_eng >=1:
      er += 'tier1_eng_threshold = (0..1), but was %f |' % t1_eng
    if t2_eng >= t1_eng:
      er += 'tier2_eng_threshold should be smaller than tier1_eng_threshold |'
    if t2_eng <= 0:
      er += 'tier2_eng_threshold must be > 0 |'
    if num_views < 1:
      er += 'num_views_threshold >= 1 |'
    if ctr_f <= 0 or ctr_f > 1:
      er += 'ctr_factor = (0..1] |'
    if t2_t3_ratio <= 0 or t2_t3_ratio >= 1:
      er += 'tier2: tier3 ratio should be (0..1) |'
    if er != '':
      return er
    self.tier1_engagement_threshold = t1_eng
    self.tier2_engagement_threshold = t2_eng
    self.num_views_threshold = num_views
    self.ctr_factor = ctr_f
    self.tier2_tier3_ratio = t2_t3_ratio
    self.put()
    return ''

class ActivityParams(db.Model):
  activity_load = db.IntegerProperty(default = 10000000) # number of interactions per time unit
  name = db.StringProperty(default = u'default')
  num_buckets = db.IntegerProperty(default = 1)
  total_updates_before_triggering = db.IntegerProperty(default=20)
  enabled = db.BooleanProperty(default = True)
  min_time_sec_between_jobs = db.IntegerProperty(default = 0)
  max_time_sec_before_triggering = db.IntegerProperty(default = 60)
  index = db.IntegerProperty() #used for templates
  
  def __str__(self):
    enabled = 'DISABLED'
    if self.enabled:
      enabled = 'enabled'
    
    return '''
      name %s, activity_load: %d %s
      num_buckets %d
      total updates before triggering: %d
      min_time_sec %d, max_time_sec %d''' % (self.name, self.activity_load, enabled,
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
    return viewer

def getPublisherSite(publisherUrl):
    publisher = db.GqlQuery('SELECT * FROM PublisherSite WHERE publisherUrl=:1', publisherUrl).get()
    if not publisher:
      publisher = PublisherSite()
      publisher.publisherUrl = publisherUrl
      publisher.put()
    return publisher

def getPublisherSites():
    publishers = db.GqlQuery('SELECT * FROM PublisherSite ORDER BY views DESC').fetch(100)
    return publishers

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


def getOrderingAlgorithmParams():
    params = db.GqlQuery('SELECT * FROM OrderingAlgorithmParams').get()
    if not params:
      params = OrderingAlgorithmParams()
      params.put()
    return params



def getPaymentConfig():
    params = db.GqlQuery('SELECT * FROM PaymentConfig').get()
    if not params:
      params = PaymentConfig()
      params.put()
    return params


def getActivities(enabled):
  query = ''
  if enabled:
    query = 'SELECT * FROM ActivityParams WHERE enabled=TRUE ORDER BY activity_load'
  else:
    query = 'SELECT * FROM ActivityParams ORDER BY activity_load'
  
  activities = db.GqlQuery(query).fetch(100);
  if not len(activities):
      activity = ActivityParams() #default
      activity.put()
      activities = [activity]
  return activities
