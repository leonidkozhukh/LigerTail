from datetime import datetime, date, time, timedelta
from google.appengine.api import memcache, users
from google.appengine.ext import db
from time import mktime
import logging
import pickle



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
WEEK = DAY * 7
MONTH = DAY * 30
  
NUM_DELTAS = 20

class Duration:
  def __init__(self, name, id, period_sec, delta_sec, num_deltas):
    self.name = name
    self.id = id
    self.sec = period_sec
    self.delta_sec = delta_sec
    self.num_deltas = num_deltas
    self.o = {}
    self.o['id'] = self.id
    self.o['sec'] = self.sec
    self.o['delta_sec'] = self.delta_sec
    self.o['num_deltas'] = self.num_deltas
  
ETERNITY = Duration('eternity', 0, None, MONTH, 12)
MONTHLY = Duration('monthly', 1, MONTH, DAY, 30)
WEEKLY = Duration('weekly', 2, WEEK, DAY, 14)
DAILY = Duration('daily', 3, DAY, HOUR, 48)
HOURLY = Duration('hourly', 4, HOUR, MIN * 5, 20)
MINUTELY = Duration('minutely', 5, MIN, MIN, 20) 

DurationInfo = {ETERNITY.id: ETERNITY,
             MONTHLY.id: MONTHLY,
             WEEKLY.id: WEEKLY,
             DAILY.id: DAILY,
             HOURLY.id: HOURLY,
             MINUTELY.id: MINUTELY}
  
class Preference:
    RECENCY = 0
    POPULARITY = 1
    
class Filter(db.Model):
  recency = db.IntegerProperty(default=50)
  popularity = db.IntegerProperty(default=50)
  durationId = db.IntegerProperty(default=ETERNITY.id)
  default = False

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


class Item(db.Model):
  creationTime = db.DateTimeProperty(auto_now_add=True)
  url = db.StringProperty()
  thumbnailUrl = db.StringProperty()
  title = db.StringProperty()
  description = db.TextProperty()
  email = db.EmailProperty()
  publisherUrl = db.StringProperty()
  price = db.IntegerProperty(default=0)
  sessionId = db.StringProperty()
  pickled_stats = db.BlobProperty(required=False)
  pickled_timedstats = db.BlobProperty(required=False)
  stats = {}
  timedStats = {}
  
  def __init__(self, *args, **kwargs):
    super(Item, self).__init__(*args, **kwargs)
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
    
  def put(self):
    '''Stores the object, making the derived fields consistent.'''
    # Pickle data
    self.pickled_stats = pickle.dumps((self.stats), 2)
    self.pickled_timedstats = pickle.dumps((self.timedStats), 2)
    
    db.Model.put(self)
 
  def update(self, statType, creationTime):
    if not self.stats.has_key(statType):
      self.stats[statType] = 1
    else:
      self.stats[statType] += 1
    self.timedStats.update(statType, creationTime)
          
    
class TimedStats(object):
  def __init__(self):  
    self.durations = self.create_()
    self.updateTime = None

  def create_(self):
    durations = {}
    for durationId in range(ETERNITY.id, MINUTELY.id+1):
      durations[durationId] = self.createStatArray_(DurationInfo[durationId].num_deltas)
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

  def update(self, updateTime = datetime.now(), statType = StatType.UNKNOWN):
    for durationId in range(ETERNITY.id, MINUTELY.id+1):
      duration = DurationInfo[durationId]
      timeBucket = int(mktime(updateTime.timetuple())) / duration.delta_sec
      logging.info ('timeBucket for updateTime %s is %d' % (str(updateTime), timeBucket))
      recordedStats = self.durations[durationId]
      statArray = []
      previousTimeBucket = 0
      if self.updateTime:
        previousTimeBucket = int(mktime(self.updateTime.timetuple())) / duration.delta_sec
      if previousTimeBucket != 0 and previousTimeBucket < timeBucket:
        i = 0
        while timeBucket > previousTimeBucket and i < duration.num_deltas:
          statArray.append(self.createEmptyStats_())
          timeBucket -= 1
          i += 1
        j = 0
        while i < duration.num_deltas:
          statArray.append(recordedStats[j])
          i += 1
          j += 1
        if statType != StatType.UNKNOWN:
          statArray[0][statType] = statArray[0][statType] + 1
        self.durations[durationId] = statArray
      elif statType != StatType.UNKNOWN: 
        recordedStats[0][statType] = recordedStats[0][statType] + 1
    self.updateTime = updateTime
    return self.durations
    
class ItemUpdateEntity(object):  
  itemId = None
  bNew = False
  statType = None
  creationTime = None
  
  def __init__(self, itemId, bNew, statType):
    self.itemId = itemId
    self.bNew = bNew
    self.statType = statType
    self.creationTime = datetime.now()


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
  
    def put(self):
      if not self.filter.default:
        '''Stores the object, making the derived fields consistent.'''
        # Pickle data
        self.pickled_filter = pickle.dumps((self.filter), 2)
        db.Model.put(self)
     
def getItems(publisherUrl):
    return db.GqlQuery("SELECT * FROM Item WHERE publisherUrl=:1", publisherUrl).fetch(1000);

def getPaidItems(publisherUrl):
    return db.GqlQuery('SELECT * FROM Item WHERE publisherUrl=:1 AND price > 0 ORDER BY price DESC', publisherUrl).fetch(1000);

  
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
