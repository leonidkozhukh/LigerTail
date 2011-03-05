#!/usr/bin/env python
#

from base import BaseHandler
from google.appengine.api import memcache
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from itemlist import itemList
import logging
import model
import response
import payment
import os
import cgi
import wsgiref.handlers
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
        if url == "submission.html":
            path = os.path.join(os.path.dirname(__file__), 'frontend', url)
        elif len(url) > 0:
            path = os.path.join(os.path.dirname(__file__), 'frontend', 'web', url)
        else:
            path = os.path.join(os.path.dirname(__file__), 'frontend', 'web', 'index.html')
        self.response.out.write(template.render(path, {}))
        
class SubmitItemHandler(BaseHandler):
    def post(self):
        BaseHandler.initFromRequest(self, self.request)
        logging.info('email %s', self.getParam('email'))
        item = model.Item()
        item.publisherUrl = self.getParam('publisherUrl')
        item.url = self.getParam('url')
        item.thumbnailUrl = self.getParam('thumbnailUrl')
        item.title = self.getParam('title')
        item.description = self.getParam('description')
        item.email = self.getParam('email')
        item.sessionId = self.viewer.sessionId
        item.price = 0
        item.put()
        BaseHandler.updateItem(self, item.publisherUrl, item=item, bNew=True)
        BaseHandler.sendConfirmationEmail(self, item)
        self.common_response.setItems([item], response.ItemInfo.SHORT)
        BaseHandler.writeResponse(self)
    
class UpdatePriceHandler(BaseHandler):
    def post(self):
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
        BaseHandler.initFromRequest(self, self.request)
        orderedItems = BaseHandler.getOrderedItems(self,
                                                   self.getParam('publisherUrl'),
                                                   self.viewer.filter)
        if self.client.numViewableItems * 2 < len(orderedItems):
          orderedItems = orderedItems[0: self.client.numViewableItems * 2]
        self.common_response.setItems(orderedItems, response.ItemInfo.SHORT)
        numViewed = 0
        for item in orderedItems:
            if numViewed >= self.client.numViewableItems:
                break
            BaseHandler.updateItem(self, item.publisherUrl, item=item, statType=model.StatType.VIEWS)
            #if self.viewer.isNew:
            #    BaseHandler.updateItems(self, item, model.StatType.UNIQUES)
        BaseHandler.writeResponse(self)
  

class GetPaidItemsHandler(BaseHandler):
    def post(self):
        BaseHandler.initFromRequest(self, self.request)
        paidItems = BaseHandler.getPaidItems(self, self.getParam('publisherUrl'))                                            
        self.common_response.setItems(paidItems, response.ItemInfo.WITH_PRICE)
        BaseHandler.writeResponse(self)

class SubmitUserInteractionHandler(BaseHandler):
    """ 
    publisherUrl
    interactions: a list of pairs <itemId>:<statType>, e.g. '23:1, 34:2'
    """
    def post(self):
        BaseHandler.initFromRequest(self, self.request)
        itemUpdates = self.getParam('interactions').split(',')
        for update in itemUpdates:
            itemWithUpdate = update.split(':')
            itemId = int(itemWithUpdate[0])
            statType = int(itemWithUpdate[1])
            if statType == model.StatType.LIKES or statType == model.StatType.CLOSES:
              BaseHandler.updateViewer(self, statType=statType, itemId=itemId)
              #TODO: handle uniques. This may be challenging since in order to know if the
              # impression is unique we need to have a map itemId->all viewers                    
          
            BaseHandler.updateItem(self, self.getParam('publisherUrl'),
                                   itemId=itemId, statType=statType)
            
        # Let client take care of immediate update
        # orderedItems = BaseHandler.getOrderedItems(self,
        #                                           self.getParam('publisherUrl'),
        #                                           self.viewer.filter)
        #self.common_response.setItems(orderedItems)

        #TODO: it's up to the client to update the ordered items
        BaseHandler.writeResponse(self)

class GetFilterHandler(BaseHandler):
    def post(self):
        BaseHandler.initFromRequest(self, self.request)
        self.common_response.setFilter(self.viewer.filter)
        BaseHandler.writeResponse(self)

class SubmitFilterHandler(BaseHandler):
    def post(self):
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
        BaseHandler.writeResponse(self)

class GetItemStatsHandler(BaseHandler):
    """
    returns an object
    {  totalStats: map StatType->int - total number of each user interaction
       timedStats: map duration.id -> Array[duration.num_deltas]<totalStats for the time period corresponding to a delta,
         in the most recent order
       updateTime - the time relative to which the recent stats are calculated.
         timedStats[duration.id][0] represent total stats in the period [updateTime-duration.delta_sec, updateTime]
         timedStats[duration.id][1] -> [updateTime - 2*duration.delta_sec, updateTime -duration.delta_sec]
       durationdInfo: map duration name -> {
         id: <duration id>
         sec: <duration in sec>
         delta_sec: <duration delta in sec>, e.g. for duration = MONTHLY delta may be 1 day, in sec
         num_deltas: <length of array representing stats for each delta. e.g. for MONTHLY num_deltas = 30 
       }
     } 
    """
    def post(self):
        BaseHandler.initFromRequest(self, self.request)
        itemWithStats = BaseHandler.getItem(self, self.getParam('itemId'))
        itemInfoType = response.ItemInfo.FULL;
        s = self.getParam('infoType');
        if len(s) and int(s) >= response.ItemInfo.SHORT and int(s) <= response.ItemInfo.FULL: 
          itemInfoType = int(s)
        self.common_response.setItems([itemWithStats], itemInfoType)
        BaseHandler.writeResponse(self)


class ProcessUpdatesWorker(webapp.RequestHandler):
    def post(self):
      itemList.processUpdates(self.request.get('publisherUrl'))

def main():
    application = webapp.WSGIApplication(
                                         [
                                          # apis
                                          ('/submit_item', SubmitItemHandler),
                                          ('/update_price', UpdatePriceHandler),
                                          ('/get_ordered_items', GetOrderedItemsHandler),
                                          ('/get_paid_items', GetPaidItemsHandler),
                                          ('/submit_user_interaction', SubmitUserInteractionHandler),
                                          ('/get_filter', GetFilterHandler),
                                          ('/submit_filter', SubmitFilterHandler),
                                          ('/get_item_stats', GetItemStatsHandler),
                                          # tasks
                                          ('/process_updates', ProcessUpdatesWorker),
                                          # everything else
                                          ('/(.*)', MainHandler)
                                         ],
                                         debug=True)
    util.run_wsgi_app(application)
    #wsgiref.handlers.CGIHandler().run(application)

if __name__ == '__main__':
    main()

