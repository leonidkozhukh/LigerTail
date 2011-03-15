#!/usr/bin/env python
#

from base import BaseHandler
from google.appengine.api import memcache
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from itemlist import itemList
import admin 
import logging
import model
import response
import payment
import os
import cgi
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
        self.response.out.write(template.render(path, {}))
        
class SubmitItemHandler(BaseHandler):
    def post(self):
        try:
          BaseHandler.initFromRequest(self, self.request)
          logging.info('email %s', self.getParam('email'))
          item = model.Item()
          item.publisherUrl = self.getParam('publisherUrl')
          item.url = self.getParam('url')
          item.thumbnailUrl = self.getParam('thumbnailUrl')
          item.title = self.getParam('title')
          item.description = self.getParam('description')
          item.price = 0
          item.email = self.getParam('email')
          item.sessionId = self.viewer.sessionId
          item.put()
          BaseHandler.updateItem(self, item.publisherUrl, item=item, bNew=True)
          BaseHandler.sendConfirmationEmail(self, item)
          self.common_response.setItems([item], response.ItemInfo.SHORT)
        except Exception:
          self.logException()
        BaseHandler.writeResponse(self)
        
class UpdatePriceHandler(BaseHandler):
    def post(self):
      try:
        BaseHandler.initFromRequest(self, self.request)
        # TODO: assert https
        item = BaseHandler.getItem(self, self.getParam('itemId'))

        if item and self._verifyTransaction(item):  
          item.updatePrice(int(self.getParam('price')), self.getParam('email'))                                  
          item.put()
          logging.info('Number of price updates : %d' % len(item.payments))
          logging.info('Last price update : %s' % str(item.payments[len(item.payments)-1]))
          BaseHandler.sendConfirmationEmail(self, item)
          # TODO: initiate order recalculation since the price changed
        self.common_response.setItems([item], response.ItemInfo.WITH_PRICE)
      except Exception:
        BaseHandler.logException()
      BaseHandler.writeResponse(self)
         
    def _verifyTransaction(self, item):
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
                       
        result = payment.verify(paymentInfo) # False for real!, False)
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
        if self.client.numViewableItems * 2 < len(orderedItems):
          orderedItems = orderedItems[0: self.client.numViewableItems * 2]
        self.common_response.setItems(orderedItems, response.ItemInfo.SHORT)
        numViewed = 0
        spot = 1
        for item in orderedItems:
            if numViewed >= self.client.numViewableItems:
                break
            BaseHandler.updateItem(self, item.publisherUrl, item=item, statType=model.StatType.VIEWS, spot=spot)
            spot += 1
            #if self.viewer.isNew:
            #    BaseHandler.updateItems(self, item, model.StatType.UNIQUES)
      except Exception:
        BaseHandler.logException()
      BaseHandler.writeResponse(self)
  

class GetPaidItemsHandler(BaseHandler):
    def post(self):
      try:
        BaseHandler.initFromRequest(self, self.request)
        paidItems = BaseHandler.getPaidItems(self, self.getParam('publisherUrl'))                                            
        self.common_response.setItems(paidItems, response.ItemInfo.WITH_PRICE)
      except Exception:
        BaseHandler.logException()
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
        BaseHandler.logException()
      BaseHandler.writeResponse(self)

class GetFilterHandler(BaseHandler):
    def post(self):
      try:
        BaseHandler.initFromRequest(self, self.request)
        self.common_response.setFilter(self.viewer.filter)
      except Exception:
        BaseHandler.logException()
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
        BaseHandler.logException()
      BaseHandler.writeResponse(self)

class GetItemStatsHandler(BaseHandler):
    def post(self):
      try:
        BaseHandler.initFromRequest(self, self.request)
        itemWithStats = BaseHandler.getItem(self, self.getParam('itemId'))
        itemInfoType = response.ItemInfo.FULL;
        s = self.getParam('infoType');
        if len(s) and int(s) >= response.ItemInfo.SHORT and int(s) <= response.ItemInfo.FULL: 
          itemInfoType = int(s)
        self.common_response.setItems([itemWithStats], itemInfoType)
      except Exception:
        BaseHandler.logException()
      BaseHandler.writeResponse(self)

class GetSpotStatsHandler(BaseHandler):
    def post(self):
      try:
        BaseHandler.initFromRequest(self, self.request)
        spot = model.getSpot(self.getParam('publisherUrl'), int(self.getParam('spot')))
        self.common_response.setSpots([spot])
      except Exception:
        BaseHandler.logException()
      BaseHandler.writeResponse(self)

class GetPublisherSiteStatsHandler(BaseHandler):
    def post(self):
      try:
        BaseHandler.initFromRequest(self, self.request)
        publisher = model.getPublisherSite(self.getParam('publisherUrl'))
        self.common_response.setPublisherSites([publisher])
      except Exception:
        BaseHandler.logException()
      BaseHandler.writeResponse(self)


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
                                          # tasks
                                          ('/process_item_updates', ProcessItemUpdatesWorker),
                                          ('/admin/(.*)', admin.AdminHandler),
                                          # everything else
                                          ('/(.*)', MainHandler),
                                          
                                         ],
                                         debug=True)
    util.run_wsgi_app(application)
    #wsgiref.handlers.CGIHandler().run(application)

if __name__ == '__main__':
    main()

