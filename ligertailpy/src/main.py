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


class MainHandler(webapp.RequestHandler):
    def get(self):
        self.response.out.write('This should be ligertail home page')

class SubmitItemHandler(BaseHandler):
    def post(self):
        BaseHandler.initFromRequest(self, self.request)
        logging.info('email %s', self.request.get('email'))
        item = model.Item()
        item.publisherUrl = self.request.get('publisherUrl')
        item.url = self.request.get('url')
        item.thumbnailUrl = self.request.get('thumbnailUrl')
        item.title = self.request.get('title')
        item.description = self.request.get('description')
        item.email = self.request.get('email')
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
        item = BaseHandler.getItem(self, self.request.get('itemId'))

        if self._verifyTransaction(self.request, item):  
          item.updatePrice(int(self.request.get('price')), self.request.get('email'))                                  
          item.put()
          logging.info('Number of price updates : %d' % len(item.payments))
          logging.info('Last price update : %s' % str(item.payments[len(item.payments)-1]))
          BaseHandler.sendConfirmationEmail(self, item)
          # TODO: initiate order recalculation since the price changed
        self.common_response.setItems([item], response.ItemInfo.WITH_PRICE)
        BaseHandler.writeResponse(self)
        
    def _verifyTransaction(self, request, item):
        paymentInfo = {'price': request.get('price'),
                       'first_name': request.get('first_name'),
                       'last_name': request.get('last_name'),
                       'itemId': request.get('itemId'),
                       'itemUrl': item.url,
                       'address': request.get('address'),
                       'city': request.get('city'),
                       'state': request.get('state'),
                       'zip': request.get('zip'),
                       'cc': request.get('cc'),
                       'expiration': request.get('expiration'),
                       'cvs': request.get('cvs') };
                       
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
                                                   self.request.get('publisherUrl'),
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
        paidItems = BaseHandler.getPaidItems(self, self.request.get('publisherUrl'))                                            
        self.common_response.setItems(paidItems, response.ItemInfo.WITH_PRICE)
        BaseHandler.writeResponse(self)

class SubmitUserInteractionHandler(BaseHandler):
    """ 
    publisherUrl
    interactions: a list of pairs <itemId>:<statType>, e.g. '23:1, 34:2'
    """
    def post(self):
        BaseHandler.initFromRequest(self, self.request)
        itemUpdates = self.request.get('interactions').split(',')
        for update in itemUpdates:
            itemWithUpdate = update.split(':')
            itemId = int(itemWithUpdate[0])
            statType = int(itemWithUpdate[1])
            if statType == model.StatType.LIKES or statType == model.StatType.CLOSES:
              BaseHandler.updateViewer(self, statType=statType, itemId=itemId)
              #TODO: handle uniques. This may be challenging since in order to know if the
              # impression is unique we need to have a map itemId->all viewers                    
          
            BaseHandler.updateItem(self, self.request.get('publisherUrl'),
                                   itemId=itemId, statType=statType)
            
        # Let client take care of immediate update
        # orderedItems = BaseHandler.getOrderedItems(self,
        #                                           self.request.get('publisherUrl'),
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
                                 durationId=self.request.get('filter.durationId'),
                                 popularity=self.request.get('filter.popularity'),
                                 recency=self.request.get('filter.recency'))
        orderedItems = BaseHandler.getOrderedItems(self,
                                                   self.request.get('publisherUrl'),
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
        itemWithStats = BaseHandler.getItem(self, self.request.get('itemId'))
        itemInfoType = response.ItemInfo.FULL;
        s = self.request.get('infoType');
        if len(s) and int(s) >= response.ItemInfo.SHORT and int(s) <= response.ItemInfo.FULL: 
          itemInfoType = int(s)
        self.common_response.setItems([itemWithStats], itemInfoType)
        BaseHandler.writeResponse(self)


class ProcessUpdatesWorker(webapp.RequestHandler):
    def post(self):
      itemList.processUpdates(self.request.get('publisherUrl'))

def main():
    application = webapp.WSGIApplication(
                                         [('/', MainHandler),
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
                                          ('/process_updates', ProcessUpdatesWorker)
                                         ],
                                         debug=True)
    util.run_wsgi_app(application)


if __name__ == '__main__':
    main()

