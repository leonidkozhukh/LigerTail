import cgi
import os
import urllib
import logging
import pickle

from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext import db
from google.appengine.ext.webapp import template
from google.appengine.api import memcache

from datetime import datetime, date, time, timedelta

# Set the debug level
_DEBUG = True

class StatType:
  UNIQUES = 0
  VIEWS = 1
  CLICKS = 2
  LIKES = 3
  CLOSES = 4
  
class Duration:
  ETERNITY = 0
  MONTHLY = 1
  WEEKLY = 2
  DAILY = 3
  HOURLY = 4
  
class Preference:
    RECENCY = 0
    POPULARITY = 1
    
class StatDataForTimePeriod(object):  
  def __init__(self):
      for type in StatType:
          self[type] = 0
  
class StatData(object):
  def __init__(self):
      for duration in Duration:
          self[duration] = StatDataForTimePeriod()
          
class Filter(db.Model):
  recency = db.IntegerProperty(default=50)
  popularity = db.IntegerProperty(default=50)
  timeliness = db.IntegerProperty(default=Duration.ETERNITY)
  default = False

  def update(self, duration, popularity, recency):
    ''' Assumption: 0 is not a valid value for 
        duration, popularity and recency
    '''
    if duration and duration != self.duration:
      self.duration = int(duration)
      self.default = False
    if popularity and popularity != self.popularity:
      self.popularity = int(popularity)
      self.default = False
    if recency and recency != self.recency:
      self.recency = int(recency)    
      self.default = False


class Item(db.Model):
  creationTime = db.DateTimeProperty()
  url = db.StringProperty()
  title = db.StringProperty()
  description = db.TextProperty()
  email = db.EmailProperty()
  publisherUrl = db.StringProperty()
  price = db.IntegerProperty(default=0)
  sessionId = db.StringProperty()
  pickled_stats = db.BlobProperty(required=False)
  stats = {}
  
  def __init__(self, *args, **kwargs):
    super(Item, self).__init__(*args, **kwargs)
    if self.pickled_stats:
      (self.stats) = pickle.loads(self.pickled_stats)
    else: 
      self.stats = {}
  
  def put(self):
    '''Stores the object, making the derived fields consistent.'''
    # Pickle data
    self.pickled_stats = pickle.dumps((self.stats), 2)
    db.Model.put(self)
 
  def update(self, statType):
      if not self.stats.has_key(statType):
          self.stats[statType] = 1
      else:
          self.stats[statType] += 1

class Viewer(db.Model):
    isNew = False
    creationTime = db.DateTimeProperty()
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
     
class Singleton(object):
     """ A Pythonic Singleton """
     def __new__(cls, *args, **kwargs):
         if '_inst' not in vars(cls):
             cls._inst = object.__new__(cls, *args, **kwargs)
         return cls._inst

def getItems(publisherUrl):
    return db.GqlQuery("SELECT * FROM Item WHERE publisherUrl=:1", publisherUrl).fetch(1000);

def getPaidItems(publisherUrl):
    #TODO: Descending, only price non-null
    return db.GqlQuery('SELECT * FROM Item WHERE publisherUrl=:1 ORDER BY price', publisherUrl).fetch(1000);

  
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

DEFAULT_FILTER_ = Filter()
DEFAULT_FILTER_.default = True

def getDefaultFilter():
    return DEFAULT_FILTER_
