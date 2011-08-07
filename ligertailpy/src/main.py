#!/usr/bin/env python
#

from base import BaseHandler
from google.appengine.api import memcache
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext import db
from itemlist import itemList
import admin 
import logging
import model
import response
import payment
import os
import cgi
import urllib
import wsgiref.handlers
import sys
#import google.appengine.webapp.template
##from google.appengine.ext.webapp import template
#import appengine_django.auth.templatetags

import os
#os.environ['DJANGO_SETTINGS_MODULE'] = 'settingsdj' 

#from google.appengine.dist import use_library
#use_library('django', '1.2')
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
          item.sessionId = self.viewer.sessionId
          item.put()
          BaseHandler.updateItem(self, item.publisherUrl, item=item, bNew=True)
          #BaseHandler.sendConfirmationEmail(self, item)
          self.common_response.setItems([item], response.ItemInfo.SHORT)
        except Exception:
          self.logException(self)
        BaseHandler.writeResponse(self)
        
def updatePublisherPrice_(publisherSiteKey, price):
  ''' Transactional method
  '''
  publisherSite = db.get(publisherSiteKey)
  publisherSite.amount += price
  publisherSite.put()
        
        
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
          itemList.refreshCacheForDefaultOrderedItems(item.publisherUrl)
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
                                                   self.viewer.filter)
        if self.client.numItems < len(orderedItems):
          orderedItems = orderedItems[0: self.client.numItems]
        self.common_response.setItems(orderedItems, response.ItemInfo.WITH_PRICE)
        ''' 
        TODO: consider submitting user interactions in this API if there is a performance cost
        numViewed = 0
        spot = 1
        for item in orderedItems:
            if numViewed >= self.client.numViewableItems:
                break
            BaseHandler.updateItem(self, item.publisherUrl, item=item, statType=model.StatType.VIEWS, spot=spot)
            spot += 1
            #if self.viewer.isNew:
            #    BaseHandler.updateItems(self, item, model.StatType.UNIQUES)
         '''
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
            if statType == model.StatType.LIKES or statType == model.StatType.CLOSES:
              BaseHandler.updateViewer(self, statType=statType, itemId=itemId)
              #TODO: handle uniques. This may be challenging since in order to know if the
              # impression is unique we need to have a map itemId->all viewers                    
            BaseHandler.updateItem(self, self.getParam('publisherUrl'),
                                   itemId=itemId, statType=statType, spot=spot)
            
        # Let client take care of immediate update
        # orderedItems = BaseHandler.getOrderedItems(self,
        #                                           self.getParam('publisherUrl'),
        #                                           self.viewer.filter)
        #self.common_response.setItems(orderedItems)

        #TODO: it's up to the client to update the ordered items
      except Exception:
        BaseHandler.logException(self)
      BaseHandler.writeResponse(self)

class GetFilterHandler(BaseHandler):
    def post(self):
      try:
        BaseHandler.initFromRequest(self, self.request)
        self.common_response.setFilter(self.viewer.filter)
      except Exception:
        BaseHandler.logException(self)
      BaseHandler.writeResponse(self)

class SubmitFilterHandler(BaseHandler):
    def post(self):
      try:
        BaseHandler.initFromRequest(self, self.request)
        BaseHandler.updateFilter(self,
                                 durationId=self.getParam('filter.durationId'),
                                 popularity=self.getParam('filter.popularity'),
                                 recency=self.getParam('filter.recency'))
        orderedItems = BaseHandler.getOrderedItems(self,
                                                   self.getParam('publisherUrl'),
                                                   self.viewer.filter)
        self.common_response.setItems(orderedItems, response.ItemInfo.SHORT)
        self.common_response.setFilter(self.viewer.filter)
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
    def get(self, url):
        #if len(url) > 0:
        #    path = os.path.join(os.path.dirname(__file__), 'web', url)
        #else:
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


class ProcessItemUpdatesWorker(webapp.RequestHandler):
    def post(self):
      itemList.processUpdates(self.request.get('publisherUrl'))

def main():
    application = webapp.WSGIApplication(
                                         [
                                          # apis
                                          ('/api/submit_item', SubmitItemHandler),
                                          ('/api/update_price', UpdatePriceHandler),
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
                                          ('/process_item_updates', ProcessItemUpdatesWorker),
                                          ('/admin', admin.AdminHandler),
                                          ('/admin/(.*)', admin.AdminHandler),
                                          ('/wiki/(.*)', CreateWikiPageHandler),
                                          # everything else
                                          ('/(.*)', MainHandler),
                                          
                                         ],
                                         debug=True)
    util.run_wsgi_app(application)
    #wsgiref.handlers.CGIHandler().run(application)

if __name__ == '__main__':
    main()

