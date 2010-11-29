import cgi
import os
import urllib
import logging
import model
import re
#import simplejson as json
from django.utils import simplejson as json

from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext import db
from google.appengine.ext.webapp import template
from google.appengine.api import memcache
from appengine_utilities.sessions import Session

# Set the debug level
_DEBUG = True

class ItemInfo(object):
    SHORT = 0
    WITH_PRICE = 1
    FULL = 2

class ResponseItem(json.JSONEncoder):
    def initFrom(self, item, itemInfo):
        self.id = item.key().id()
        self.url = item.url
        self.title = item.title
        self.description = item.description
        self.itemInfo = itemInfo
        self.price = item.price
        #TODO: add other stats
        #publisherUrl
        #email
        #sessionId
        #sessionId
        #pickled_stats

    def default(self, o):
      if isinstance(o, ResponseItem):
          ret = {'url' : o.url,
              'title' : o.title,
              'description' : o.description,
              'id' : o.id
              }
          if o.itemInfo == ItemInfo.WITH_PRICE or o.itemInfo == ItemInfo.FULL:
              ret['price'] = o.price
          #TODO: add stats for itemInfo = full
          return ret
      return json.JSONEncoder.default(self, o)

class ResponseFilter(json.JSONEncoder):
    def initFrom(self, filter):
        self.timeliness = filter.timeliness
        self.recency = filter.recency
        self.popularity = filter.popularity
        
    def default(self, o):
      if isinstance(o, ResponseFilter):
          ret = {'timeliness' : o.timeliness,
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
    self.sessionId = None
    self.filter = {}
    self.status = "ok"
    self.error = ""

  def default(self, o):
      if isinstance(o, CommonResponse):
          return {"items" : o.items,
              "filter" : o.filter,
              "status" : o.status,
              "error" : o.error
              }
      elif isinstance(o, ResponseItem):
          return json.dumps(o, cls=ResponseItem)
      elif isinstance(o, ResponseFilter):
          return json.dumps(o, cls=ResponseFilter) 
      else:
          return json.JSONEncoder.default(self, o)
  
  
  def setItems(self, items, itemInfo):
    for item in items:
      ri = ResponseItem()
      ri.initFrom(item, itemInfo)
      self.items.append(ri)
  
  def setFilter(self, filter):
    self.filter = ResponseFilter()
    self.filter.initFrom(filter)
    
