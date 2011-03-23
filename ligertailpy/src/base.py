from appengine_utilities.sessions import Session
from django.utils import simplejson as json
from google.appengine.api import users
from google.appengine.api import mail
from google.appengine.ext import webapp
from itemlist import itemList
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
  jsonp_callback = None
  
  def initFromRequest(self, req):
    self.common_response.reset()
    session = Session()
    sessionKey = str(session.session.session_key)
    logging.info("%s %s", req.path_url, sessionKey)
    self.viewer = model.getViewer(sessionKey)
    self.client = Client(numViewableItems=req.get('client.numViewableItems'))
    self.jsonp_callback = unicode(req.get('callback'))
    
  def getParam(self, name):
    return cgi.escape(self.request.get(name))
  
  def updateItem(self, publisherUrl, itemId=None, item=None, bNew=False, statType=None, spot=0):
    itemList.updateItem(publisherUrl, itemId, item, bNew, statType, int(spot))
 
  def getOrderedItems(self, publisherUrl, filter):
    defaultOrderedItems = itemList.getDefaultOrderedItems(publisherUrl)
    # use spot = 0 to record publisher site views and uniques
    itemList.updateItem(publisherUrl, None, None, False, model.StatType.VIEWS, 0)
    if self.viewer.isNew:
      itemList.updateItem(publisherUrl, None, None, False, model.StatType.UNIQUES, 0)
    if filter.default:
      logging.info('return default from memcache for %s', publisherUrl)
      return defaultOrderedItems
    logging.info('filter is not default for %s', publisherUrl)
    return filterStrategy.applyFilter(defaultOrderedItems, filter)
      
  def getPaidItems(self, publisherUrl):
      logging.info('getPaidItems')
      items = model.getPaidItems(publisherUrl)
      return items
 
  def getItem(self, itemId):
      item = model.Item.get_by_id(int(itemId))
      return item          
      
      
  def updateViewer(self, statType=None, itemId=None):
      if statType and itemId:
          if statType == model.StatType.CLOSES:
              self.viewer.closes.append(itemId)
          elif statType == model.StatType.LIKES:
              self.viewer.likes.append(itemId)

  def updateFilter(self, durationId=None, popularity=None, recency=None):
      self.viewer.filter = model.Filter()
      self.viewer.filter.update(durationId, popularity, recency)
      if not self.viewer.filter.default:
        self.viewer.put()          
      
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
    self.response.out.write('%s(%s);' % (self.jsonp_callback, s))
    self.response.headers["Access-Control-Allow-Origin"] = '*'

  def logException(self):
    self.common_response.set_error('Internal server error %s' % sys.exc_info()[1])
    logging.exception("Error")

