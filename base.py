from appengine_utilities.sessions import Session
from django.utils import simplejson as json
from google.appengine.api import users
from google.appengine.api import mail
from google.appengine.ext import webapp
from itemlist import itemList
from defaultitemlist import defaultItemList
from filterstrategy import filterStrategy
import logging
import model
import cgi
import re
import response
import sys


# Set the debug level
_DEBUG = True


    
class Client(object):
    numViewableItems = 5
    numItems = 30
    def __init__(self, numViewableItems):
        if numViewableItems:
            self.numViewableItems = numViewableItems

class BaseHandler(webapp.RequestHandler):
  """Base request handler extends webapp.Request handler

     It defines the generate method, which renders a Django template
     in response to a web request
  """
  common_response = response.CommonResponse()
  client = {}
  jsonp_callback = None

  def options(self):
      self.response.headers['Access-Control-Allow-Origin'] = '*'
      self.response.headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS'
      self.response.headers['Access-Control-Max-Age'] = 1000
      self.response.headers['Access-Control-Allow-Headers'] = '*'
      return self.response

  
  def initFromRequest(self, req):
    self.common_response.reset()
    self.client = Client(numViewableItems=req.get('client.numViewableItems'))
    self.jsonp_callback = unicode(req.get('callback'))
    
  def getParam(self, name):
    return cgi.escape(self.request.get(name))
  
  # TODO item functions are better encapsulated elsewhere, not at the baseHandler level.
  # TODO move item functions to the listitem module.

  def updateItem(self, publisherUrl, itemId=None, item=None, bNew=False, statType=None, spot=0):
    if publisherUrl == 'default':
      if defaultItemList.disallowIncoming():
        return
      publisherUrl = defaultItemList.getPublisherUrl()
    itemList.updateItem(publisherUrl, itemId, item, bNew, statType, int(spot))
 
  def getOrderedItems(self, publisherUrl, filter):
    defaultOrderedItems = itemList.getDefaultOrderedItems(publisherUrl)
    # use spot = 0 to record publisher site views and uniques
    try:
      pass
    except Exception:
      logging.warning('getOrderedItems.updateItem %s' % sys.exc_info()[1])

    if filter.default:
      logging.info('return default from memcache for %s', publisherUrl)
      return defaultOrderedItems
    logging.info('filter is not default for %s', publisherUrl)
    return filterStrategy.applyFilter(defaultOrderedItems, filter)
      
  def setDefaultItems(self, num):
    if defaultItemList.getPublisherUrl() == self.getParam('publisherUrl'):
      return # Do not sets default links for the url that is hosting it
    defaultItems = defaultItemList.getOrderedItems()
    if num < len(defaultItems):
      defaultItems = defaultItems[0: num]
    if len(defaultItems):
      self.common_response.setDefaultItems(defaultItems, response.ItemInfo.SHORT)

  def getPaidItems(self, publisherUrl):
      logging.info('getPaidItems')
      items = model.getPaidItems(publisherUrl)
      return items
 
  def getItem(self, itemId):
      item = model.Item.get_by_id(int(itemId))
      return item          
      
  def sendConfirmationEmail(self, email, price, item):
      logging.info('sendConfirmationEmail %s', email)
      if not mail.is_email_valid(email):
        logging.error('email %s is not valid for item %s' % (email, item.key().id()))
      else:
        sender_address = "Ligertail.com Support <support@ligertail.com>"
        subject = "Confirm your payment of $%s.00 dollars" % price
        body = """
Hello,
This is a confirmation that we have received your payment of $%s.00 dollars
for '%s' <%s> published on %s.
""" % (price, item.title, item.url, item.publisherUrl)

        mail.send_mail(sender_address, email, subject, body)    

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
    self.response.out.write('%s(%s);' % (self.jsonp_callback, s))
    self.response.headers["Access-Control-Allow-Origin"] = '*'

  def logException(self):
    self.common_response.set_error('Internal server error %s' % sys.exc_info()[1])
    logging.exception("Error")

