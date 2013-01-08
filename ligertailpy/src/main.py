#!/usr/bin/env python
#

from base import BaseHandler
from google.appengine.api import memcache
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext import db
from itemlist2 import itemList2
from xml.dom import minidom
import admin 
import logging
import model
import response
import payment
import payment2
import os
import cgi
import urllib2
import urllib
import urlparse
from google.appengine.api import urlfetch
import wsgiref.handlers
import sys
import simplejson as json
import string
import math
import traceback
from google.appengine.ext.webapp import template



class MainHandler(webapp.RequestHandler):
    def get(self, url):
        if len(url) > 0:
            path = os.path.join(os.path.dirname(__file__), 'web', url)
        else:
            path = os.path.join(os.path.dirname(__file__), 'web', 'index.html')
        out = ''
        try:
          out = template.render(path, {})
          self.response.headers["Access-Control-Allow-Origin"] = '*'
        except Exception:
          logging.warning('mainHandler: %s' % sys.exc_info()[1])
          out = ''
        self.response.out.write(out)
        
    def post(self, url):
        logging.info(url)
                
    def options(self):
        self.response.headers['Access-Control-Allow-Origin'] = '*'
        self.response.headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS'
        self.response.headers['Access-Control-Max-Age'] = 1000
        self.response.headers['Access-Control-Allow-Headers'] = '*'
        return self.response

        
class SubmitItemHandler(BaseHandler):
    def post(self):
        try:
          BaseHandler.initFromRequest(self, self.request)
          logging.info('email %s', self.getParam('email'))
          item = model.Item()
          item.publisherUrl = self.getParam('publisherUrl')
          item.url = self.getParam('url')
          item.thumbnailUrl = self.getParam('thumbnailUrl')
          item.title = self.getParam('title').replace('%u', '\\u').decode('unicode-escape')
          item.description = self.getParam('description').replace('%u', '\\u').decode('unicode-escape')
          item.price = 0
          item.email = self.getParam('email')
          item.put()
          self.common_response.setItems([item], response.ItemInfo.SHORT)
        except Exception:
          BaseHandler.logException(self)
        BaseHandler.writeResponse(self)
        
def updatePublisherPrice_(publisherSiteKey, price):
  ''' Transactional method
  '''
  publisherSite = db.get(publisherSiteKey)
  publisherSite.amount += price
  publisherSite.put()
        
        
class UpdatePrice2Handler(BaseHandler):
    def post(self):
      try:
        BaseHandler.initFromRequest(self, self.request)
        # TODO: assert https
        item = BaseHandler.getItem(self, self.getParam('itemId'))
        paymentConfig = model.getPaymentConfig()
        if item and self._verifyTransaction(item, paymentConfig.test_mode):  
          price = int(self.getParam('price'))
          item.updatePrice(price, self.getParam('email'))
          item.put()
          publisherSite = model.getPublisherSite(item.publisherUrl)
          db.run_in_transaction(updatePublisherPrice_, publisherSite.key(), price)
          itemList2.refreshCacheForDefaultOrderedItems(item.publisherUrl)
          logging.info('Number of price updates : %d' % len(item.payments))
          logging.info('Last price update : %s' % str(item.payments[len(item.payments)-1]))
          if paymentConfig.send_email:
            BaseHandler.sendConfirmationEmail(self, self.getParam('email'), self.getParam('price'), item)                                   
        self.common_response.setItems([item], response.ItemInfo.WITH_PRICE)
      except Exception:
        BaseHandler.logException(self)
      BaseHandler.writeResponse(self)
         
    def _verifyTransaction(self, item, testmode):
        paymentInfo = {'price': self.getParam('price'),
                       'token': self.getParam('token'),
                       'itemId': self.getParam('itemId'),
                       'itemUrl': item.url
                       };
        if item.publisherUrl.find('test.ligertail.com/test') == 0:
          logging.info('approving test transaction')
          return True
           
        result = payment2.charge(paymentInfo, testmode)
        logging.info('verifyTransaction %s', str(result))
        if not result.paid:
          self.common_response.set_error('Failed to charge %s' % result.description)
        #TODO: verify transaction is decrypted and contains correct item title/url/price
        return result.paid

class UpdatePriceHandler(BaseHandler):
    def post(self):
      try:
        BaseHandler.initFromRequest(self, self.request)
        # TODO: assert https
        item = BaseHandler.getItem(self, self.getParam('itemId'))
        paymentConfig = model.getPaymentConfig()
        if item and self._verifyTransaction(item, paymentConfig.test_mode):  
          price = int(self.getParam('price'))
          item.updatePrice(price, self.getParam('email'))
          item.put()
          publisherSite = model.getPublisherSite(item.publisherUrl)
          db.run_in_transaction(updatePublisherPrice_, publisherSite.key(), price)
          itemList2.refreshCacheForDefaultOrderedItems(item.publisherUrl)
          logging.info('Number of price updates : %d' % len(item.payments))
          logging.info('Last price update : %s' % str(item.payments[len(item.payments)-1]))
          if paymentConfig.send_email:
            BaseHandler.sendConfirmationEmail(self, self.getParam('email'), self.getParam('price'), item)                                   
        self.common_response.setItems([item], response.ItemInfo.WITH_PRICE)
      except Exception:
        BaseHandler.logException(self)
      BaseHandler.writeResponse(self)
         
    def _verifyTransaction(self, item, testmode):
        paymentInfo = {'price': self.getParam('price'),
                       'first_name': self.getParam('first_name'),
                       'last_name': self.getParam('last_name'),
                       'itemId': self.getParam('itemId'),
                       'itemUrl': item.url,
                       'address': self.getParam('address'),
                       'city': self.getParam('city'),
                       'state': self.getParam('state'),
                       'zip': self.getParam('zip'),
                       'cc': self.getParam('cc'),
                       'expiration': self.getParam('expiration'),
                       'cvs': self.getParam('cvs') };
        if item.publisherUrl.find('test.ligertail.com/test') == 0:
          logging.info('approving test transaction')
          return True
           
        result = payment.verify(paymentInfo, testmode)
        logging.info('verifyTransaction %s', str(result))
        if result.code != u'1':
          self.common_response.set_error(result.reason_text)
        #TODO: verify transaction is decrypted and contains correct item title/url/price
        return result.code == u'1'

class GetOrderedItemsHandler(BaseHandler):
     
    def post(self):
      try:
        BaseHandler.initFromRequest(self, self.request)
        orderedItems = BaseHandler.getOrderedItems(self,
                                                   self.getParam('publisherUrl'),
                                                   model.getDefaultFilter()) 
        if self.client.numItems < len(orderedItems):
          orderedItems = orderedItems[0: self.client.numItems]
        self.common_response.setItems(orderedItems, response.ItemInfo.WITH_PRICE)
        if self.client.numItems - len(orderedItems) > 0:
          BaseHandler.setDefaultItems(self, self.client.numItems - len(orderedItems))
      except Exception:
        BaseHandler.logException(self)
      BaseHandler.writeResponse(self)
  

class GetPaidItemsHandler(BaseHandler):
    def post(self):
      try:
        BaseHandler.initFromRequest(self, self.request)
        paidItems = BaseHandler.getPaidItems(self, self.getParam('publisherUrl'))                                            
        self.common_response.setItems(paidItems, response.ItemInfo.WITH_PRICE)
      except Exception:
        BaseHandler.logException(self)
      BaseHandler.writeResponse(self)

class SubmitUserInteractionHandler(BaseHandler):
    """ 
    publisherUrl
    interactions: a list of pairs <itemId>:<statType>, e.g. '23:1, 34:2'
    """
    def post(self):
      try:
        BaseHandler.initFromRequest(self, self.request)
        itemUpdates = self.getParam('interactions').split(',')
        for update in itemUpdates:
            itemWithUpdate = update.split(':')
            itemId = int(itemWithUpdate[0])
            statType = int(itemWithUpdate[1])
            spot = int(itemWithUpdate[2])
            BaseHandler.updateItem(self, self.getParam('publisherUrl'),
                                   itemId=itemId, statType=statType, spot=spot)
      except Exception:
        BaseHandler.logException(self)
      BaseHandler.writeResponse(self)

class GetFilterHandler(BaseHandler):
    def post(self):
      try:
        BaseHandler.initFromRequest(self, self.request)
      except Exception:
        BaseHandler.logException(self)
      BaseHandler.writeResponse(self)

class SubmitFilterHandler(BaseHandler):
    def post(self):
      try:
        BaseHandler.initFromRequest(self, self.request)
        orderedItems = BaseHandler.getOrderedItems(self,
                                                   self.getParam('publisherUrl'),
                                                   model.getDefaultFilter())
        self.common_response.setItems(orderedItems, response.ItemInfo.SHORT)
      except Exception:
        BaseHandler.logException(self)
      BaseHandler.writeResponse(self)

class GetItemStatsHandler(BaseHandler):
    def post(self):
      try:
        BaseHandler.initFromRequest(self, self.request)
        #itemId is space delimited list of itemIds
        itemIds = self.getParam('itemId').split(" ")
        itemsWithStats = []
        for itemId in itemIds:
            itemsWithStats.append(BaseHandler.getItem(self, itemId))
        itemInfoType = response.ItemInfo.FULL;
        s = self.getParam('infoType');
        if len(s) and int(s) >= response.ItemInfo.SHORT and int(s) <= response.ItemInfo.FULL: 
          itemInfoType = int(s)
        logging.info('getItemStats for %s, infotype = %s->%d' % (self.getParam('itemId'), s, itemInfoType))
        self.common_response.setItems(itemsWithStats, itemInfoType)
      except Exception:
        BaseHandler.logException(self)
      BaseHandler.writeResponse(self)

class GetSpotStatsHandler(BaseHandler):
    def post(self):
      try:
        BaseHandler.initFromRequest(self, self.request)
        #spot is space delimited list of spots
        spots = self.getParam('spot').split(" ")
        spotsWithStats = []
        for spot in spots:
            spotsWithStats.append(model.getSpot(self.getParam('publisherUrl'), int(spot))) 
        self.common_response.setSpots(spotsWithStats)
      except Exception:
        BaseHandler.logException(self)
      BaseHandler.writeResponse(self)

class GetPublisherSiteStatsHandler(BaseHandler):
    def post(self):
      try:
        BaseHandler.initFromRequest(self, self.request)
        #publisherUrl is space delimited list of publishers
        publishers = self.getParam('publisherUrl').split(" ")
        publishersWithStats = []
        for publisher in publishers:
            publishersWithStats.append(model.getPublisherSite(publisher)) 
        self.common_response.setPublisherSites(publishersWithStats)
      except Exception:
        BaseHandler.logException(self)
      BaseHandler.writeResponse(self)
      
class CreateWikiPageHandler(BaseHandler):
    
    errors = 0
    successes = 0
    exceptions = 0
    publisherUrl = ""
    links_map = {}
    
    def handle_result(self, rpc):
        
      try:
        result = rpc.get_result()
        embedly_results = json.loads(result.content)
        for link_info in embedly_results:
          item = model.Item()
          
          item.publisherUrl = self.publisherUrl
          
          if 'url' in link_info:
            item.url = link_info['url']
            #urls are not always returning in the same form as were requested, which means some
            #cannot be tracked
            if (self.links_map.has_key(item.url) == False or self.links_map[item.url] is None):
              self.links_map[item.url] = 'DONE'
            else:
              self.successes -= 1 #this url was already retrieved previously
          else:
            self.errors += 1
            logging.warning('Invalid link for %s \n %s' % (self.publisherUrl, link_info))
            continue
          if 'thumbnail_url' in link_info:
            item.thumbnailUrl = link_info['thumbnail_url']
          else:
            item.thumbnailUrl = "http://ligertailpayment.appspot.com/frontend/images/default.png"
          if 'title' in link_info:
            item.title = link_info['title']#.replace('%u', '\\u').decode('unicode-escape')
            item.description = link_info['title']#.replace('%u', '\\u').decode('unicode-escape')
          else:
            item.title = item.url
            
          if 'description' in link_info:
            item.description = link_info['description']#.replace('%u', '\\u').decode('unicode-escape')
          else:
            item.description = item.title
            
          item.price = 0
          item.email = 'wiki@ligertail.com'
          item.sessionId = 'wiki'
          item.put()
          logging.info('Submitted %s ' % item)
          self.successes += 1
      except Exception:
        logging.warning('createWikiHandler: %s' % sys.exc_info()[1])
        if str(sys.exc_info()[1]) != 'ApplicationError: 2 timed out':
            self.exceptions += 1
            #logging.warning(traceback.format_exc())
        
    
    def create_callback(self, rpc):
        return lambda: self.handle_result(rpc)
    
    def getUnretreivedUrls(self):
        links = []
        for link in self.links_map.keys():
            if (self.links_map[link] is None):
              links.append(link)
        
        return links
      
    def copyWikiLinks(self, url_title):
        
        
        self.publisherUrl = self.request.host + "/wiki/" + url_title
        if self.publisherUrl[-1] != "/":
            self.publisherUrl += "/"
        self.publisherUrl = self.publisherUrl.lower()
        self.url_list = []
        self.errors = 0
        self.successes = 0
        self.exceptions = 0
        
        config = model.getLigerpediaConfig()
        config_timeout = config.embedly_request_timeout
        config_ellimit = str(config.embedly_request_links_total)
        
        #capitalize first letter for wiki
        #url_title = string.capwords(url_title.lower(), '_')
        self.links_map.clear()
        attempt = 0
        
        while attempt < 2 and len(self.links_map) < 1:
          #querying http://en.wikipedia.org/w/api.php for external links for url_title in XML format
          #wikipedia ellimit can go up to 500. There are 10 parallel embedly requests of maximum 20 links (200 total)
          url = 'http://en.wikipedia.org/w/api.php?action=query&prop=extlinks&ellimit=' + config_ellimit + '&format=xml&titles=' + url_title
        
          data = urllib2.urlopen(url).read()
        
          dom = minidom.parseString(data)
          for node in dom.getElementsByTagName('el'):
            #if link is within wiki, ignore
            extlink = node.firstChild.data
            if (extlink.lower().startswith("http") != True):
              continue
            self.links_map[extlink] = None
        
          attempt = attempt + 1
          
          if len(self.links_map) < 1 and attempt < 2:
            #casing possibly incorrect, will attempt to search for the right term
            url = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' + urllib.quote_plus(url_title)
            search_results = json.loads(urllib2.urlopen(url).read())
            search_list = search_results[1]
            if len(search_list) > 0:
              url_title = search_list[0].replace(' ','_')
            else: #search did not return anything -- will not try any more
              break  
        
        if len(self.links_map) < 1: 
          return
        
        
        
        api_url = 'http://api.embed.ly/1/oembed?'
        
        #sending requests every 2 seconds up until config_timeout
        #embed.ly will cache requests from the earlier searches so that we can retrieve them later if needed
        attempt = 0
        while ((attempt * 2) <= config_timeout and self.successes < config_ellimit and self.successes < 20):
            
            unretrieved_links = self.getUnretreivedUrls()
            logging.info('requesting %d links from embedly' % (len(unretrieved_links)))
            urls_per_request = math.ceil(len(unretrieved_links) / 10.0)
                        
            rpcs = []
            links_it = iter(unretrieved_links)
            iteration_stopped = False
            
            for asynch_request in range(10):
                
                rpc = urlfetch.create_rpc(deadline=2)
                rpc.callback = self.create_callback(rpc)
                url_list = ""
                j = 0
                try:
                  while not(j == urls_per_request and asynch_request < 9):
                      link = str(links_it.next())
                      if len(url_list) > 0:
                          url_list += ","           
                      url_list += urllib.quote_plus(link)
                      j = j + 1
                    
                except StopIteration:
                  iteration_stopped = True
                
                urlfetch.make_fetch_call(rpc, api_url + "key=863cd350298b11e091d0404058088959&urls=" + url_list)
                logging.info('ASYNCH REQUEST %d, requesting %d links' % (asynch_request, j))
                logging.info('ASYNCH REQUEST: %s ' % api_url + "key=863cd350298b11e091d0404058088959&urls=" + url_list)
                rpcs.append(rpc)
                
                if iteration_stopped:
                  break
            
            # Finish all RPCs, and let callbacks process the results.
            for rpc in rpcs:
                rpc.wait()
                
            attempt = attempt + 1
          
        logging.info('successes / errors / exceptions: %d %d %d' % (self.successes, self.errors, self.exceptions))
        if (self.successes > 0):
            itemList2.refreshCacheForDefaultOrderedItems(self.publisherUrl)
        
      
    def get(self, url):
        BaseHandler.initFromRequest(self, self.request)
        if not url or len(url) < 1:
            return
        
        #if len(url) > 0:
        #    path = os.path.join(os.path.dirname(__file__), 'web', url)
        #else:
        publisherUrl = self.request.host + "/wiki/" + url
        if publisherUrl[-1] != "/":
            publisherUrl += "/"
        #publisherUrl = publisherUrl.lower()
        items = BaseHandler.getOrderedItems(self,
                                            publisherUrl,
                                            model.getDefaultFilter()) #NO_VIEWER self.viewer.filter)

        #publisherLinks = model.getItems(publisherUrl)
        if len(items) < 1:
            self.copyWikiLinks(url)
            
        path = os.path.join(os.path.dirname(__file__), 'web', 'wiki_template.html')
        out = ''
        try:
          out = template.render(path, {})
          self.response.headers["Access-Control-Allow-Origin"] = '*'
        except Exception:
          logging.warning('createWikiHandler: %s' % sys.exc_info()[1])
          out = ''
        self.response.out.write(out)
    

class SubmitErrorHandler(BaseHandler):
    def post(self):
        BaseHandler.initFromRequest(self, self.request)
        logging.error('Client Error for %s \n%s' % (self.getParam('publisherUrl'), self.getParam('stack')));


def main():
    application = webapp.WSGIApplication([
        # apis
        ('/api/submit_item', SubmitItemHandler),
        ('/api/update_price', UpdatePriceHandler),
        ('/api/update_price2', UpdatePrice2Handler),
        ('/api/get_ordered_items', GetOrderedItemsHandler),
        ('/api/get_paid_items', GetPaidItemsHandler),
        ('/api/submit_user_interaction', SubmitUserInteractionHandler),
        ('/api/get_filter', GetFilterHandler),
        ('/api/submit_filter', SubmitFilterHandler),
        ('/api/get_item_stats', GetItemStatsHandler),
        ('/api/get_spot_stats', GetSpotStatsHandler),
        ('/api/get_publisher_site_stats', GetPublisherSiteStatsHandler),
        ('/api/submit_error', SubmitErrorHandler),
        # tasks
        ('/admin', admin.AdminHandler),
        ('/admin/(.*)', admin.AdminHandler),
        ('/wiki/(.*)', CreateWikiPageHandler),
        # everything else
        ('/(.*)', MainHandler),
      ], debug=True)
    util.run_wsgi_app(application)
    #wsgiref.handlers.CGIHandler().run(application)

if __name__ == '__main__':
    main()

