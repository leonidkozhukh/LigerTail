import cgi
import os
import urllib
import logging
import model
import re
import response
import datetime
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


    
class Client(object):
    numViewableItems = 5
    def __init__(self, numViewableItems):
        if numViewableItems:
            self.numViewableItems = numViewableItems

class BaseHandler(webapp.RequestHandler):
  """Base request handler extends webapp.Request handler

     It defines the generate method, which renders a Django template
     in response to a web request
  """
  common_response = response.CommonResponse()
  viewer = None
  client = {}
  
  def initFromRequest(self, req):
    self.common_response.reset()
    session = Session()
    sessionKey = str(session.session.session_key)
    logging.info("%s %s", req.path_url, sessionKey)
    self.viewer = model.getViewer(sessionKey)
    self.client = Client(numViewableItems=req.get('client.numViewableItems'))
          
  def updateItem(self, itemId=None, item=None, bNew=False, statType=None):
      if not item:
        logging.info('updateItems %d', itemId)
        item = model.Item.get_by_id(itemId)
      if statType:
        logging.info('updating item %s: statType: %d', item.url, statType)
        item.update(statType)
      #TODO: postpone operation by putting it into item-hashed buckets
      item.put()
 
  def getOrderedItems(self, publisherUrl, filter):
      logging.info('getOrderedItems')
      defaultOrderedItems = memcache.get(publisherUrl)
      if defaultOrderedItems is not None and filter.default:
        logging.info('return default from memcache for %s', publisherUrl)
        return defaultOrderedItems
      elif defaultOrderedItems is not None:
        logging.info('memcache found, but filter is not default for %s', publisherUrl)
        return self.applyFilter(defaultOrderedItems, filter)
      else:
        items = model.getItems(publisherUrl)
        defaultOrderedItems = self.applyFilter(items, model.getDefaultFilter())
        logging.info('repopulating memache for %s', publisherUrl)
        memcache.add(publisherUrl, defaultOrderedItems)
        if not filter.default:
          return self.applyFilter(defaultOrderedItems, filter)
        return defaultOrderedItems
  
  def getPaidItems(self, publisherUrl):
      logging.info('getPaidItems')
      items = model.getPaidItems(publisherUrl)
      return items
 
  def getItemWithStats(self, publisherUrl, itemId):
      #TODO: retrieve stats
      return model.Item.get_by_id(int(itemId)) 
  
  def updateViewer(self, statType=None, itemId=None):
      if statType and itemId:
          if statType == model.StatType.CLOSES:
              self.viewer.closes.append(itemId)
          elif statType == model.StatType.LIKES:
              self.viewer.likes.append(itemId)

  def updateFilter(self, duration=None, popularity=None, recency=None):
      self.viewer.filter = model.Filter()
      self.viewer.filter.update(duration, popularity, recency)
      if not self.viewer.filter.default:
        self.viewer.put()    
          
  def applyFilter(self, items, filter):
    LIKES_RATE_K = 500.0
    CLICKS_RATE_K = 100.0
    CLOSES_RATE_K = -20.0
    TOTAL_LIKES_K = 1.0
    TOTAL_CLICKS_K = 1.0
    TOTAL_CLOSES_K = -1.0
    TOTAL_VIEWS_K = -0.2
    
    RECENCY_K = 1000.0
    PRICE_K = 1000.0
    today = datetime.datetime.today()
    for item in items:
      likes = float(item.stats[model.StatType.LIKES])
      closes = float(item.stats[model.StatType.CLOSES])
      views = float(item.stats[model.StatType.VIEWS])
      clicks = float(item.stats[model.StatType.CLICKS])
      likesRate = 0.0
      clicksRate = 0.0
      closesRate = 0.0
      if views:
        likesRate = likes/views
        closesRate = closes/views
        clicksRate = clicks/views
      popularity = likesRate * LIKES_RATE_K + \
          clicksRate * CLICKS_RATE_K + \
          closesRate * CLOSES_RATE_K + \
          likes * TOTAL_LIKES_K + \
          clicks * TOTAL_CLICKS_K + \
          closes * TOTAL_CLOSES_K
      seconds = float((today - item.creationTime).seconds)
      recency = RECENCY_K / (seconds+1) 
      item.v = popularity * filter.popularity + \
          recency * filter.recency + \
          views * TOTAL_VIEWS_K + \
          float(item.price) / seconds * PRICE_K
    orderedItems = sorted(items, key=lambda item : item.v, reverse=True)
    return orderedItems  
      
  def sendConfirmationEmail(self, item):
      logging.info('sendConfirmationEmail %s', item.email)
      #TODO: add email
      
  def generate(self, template_name, template_values={}):
    """Generate takes renders and HTML template along with values
       passed to that template


       Args:
         template_name: A string that represents the name of the HTML template
         template_values: A dictionary that associates objects with a string
           assigned to that object to call in the HTML template.  The defualt
           is an empty dictionary.
    """
    # We check if there is a current user and generate a login or logout URL
    #user = users.get_current_user()

    logging.debug('generating room.html')
    #if user:
    #  log_in_out_url = users.create_logout_url('/')
    #  self.crumble_user = model.get_crumble_user(user)
    #else:
    #  log_in_out_url = users.create_login_url(self.request.path)

    # We'll display the user name if available and the URL on all pages
    #values = {'user': user, 'log_in_out_url': log_in_out_url}
    #values.update(template_values)

    # Construct the path to the template
    #directory = os.path.dirname(__file__)
    #path = os.path.join(directory, 'templates', template_name)

    # Respond to the request by rendering the template
    #self.response.out.write(template.render(path, values, debug=_DEBUG))
    #logging.debug("rendered page")

  def extract_params(self, value_string):
    pattern_string = self.parameterized_url()
    names = re.findall(r"\{(.*?)\}", pattern_string)
    regex = re.sub(r"\{.*?\}", r"([^/\?]*)", pattern_string)

    matcher = re.search(regex, value_string)

    if not matcher:
      return {}

    match = matcher.groups()
    result = {}
    for i in xrange(len(names)):
      if i > len(match):
        result[names[i]] = None
      else:
        result[names[i]] = match[i]

    return result

  def writeResponse(self):
    logging.info("#### WRITING RESOPONSE #####")
    s = json.dumps(self.common_response, cls=response.CommonResponse) #, default=encode_response)
    logging.info(s)
    self.response.out.write(s)


