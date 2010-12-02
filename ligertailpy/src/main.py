#!/usr/bin/env python
#

import cgi
import os
import urllib
import logging
import model
import response

from base import BaseHandler
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext import db
from google.appengine.ext.webapp import template
from google.appengine.api import memcache
from datetime import datetime, date, time, timedelta


class MainHandler(webapp.RequestHandler):
    def get(self):
        self.response.out.write('This should be ligertail home page')

class SubmitItemHandler(BaseHandler):
    def post(self):
        BaseHandler.initFromRequest(self, self.request)
        item = model.Item()
        item.publisherUrl = self.request.get('publisherUrl')
        item.url = self.request.get('url')
        item.title = self.request.get('title')
        item.description = self.request.get('description')
        item.email = self.request.get('email')
        item.sessionId = self.viewer.sessionId
        item.price = 0
        item.put()
        BaseHandler.updateItem(self, item=item, bNew=True)
        BaseHandler.sendConfirmationEmail(self, item)
        BaseHandler.writeResponse(self)
    
class SubmitPaidItemHandler(BaseHandler):
    def post(self):
        BaseHandler.initFromRequest(self, self.request)
        item = model.Item()
        item.publisherUrl = self.request.get('publisherUrl')
        item.url = self.request.get('url')
        item.title = self.request.get('title')
        item.description = self.request.get('description')
        item.email = self.request.get('email')
        item.price = int(self.request.get('price'))
        item.sessionId = self.viewer.sessionId
        if self._verifyTransaction(self.request, item):                             
            item.put()
            BaseHandler.updateItem(self, item=item, bNew=True)
            BaseHandler.sendConfirmationEmail(self, item)
        else:
            self.common_response.set_error('Unauthorized paid item submission ')
        BaseHandler.writeResponse(self)
        
    def _verifyTransaction(self, request, item):
        logging.info('verifyTransaction')
        #TODO: verify transaction is decrypted and contains correct item title/url/price
        return True

class GetOrderedItemsHandler(BaseHandler):
    def post(self):
        BaseHandler.initFromRequest(self, self.request)
        orderedItems = BaseHandler.getOrderedItems(self,
                                                   self.request.get('publisherUrl'),
                                                   self.viewer.filter)
        self.common_response.setItems(orderedItems, response.ItemInfo.FULL)
        numViewed = 0
        for item in orderedItems:
            if numViewed >= self.client.numViewableItems:
                break
            BaseHandler.updateItem(self, item=item, statType=model.StatType.VIEWS)
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
          
            BaseHandler.updateItem(self, itemId=itemId, statType=statType)
            
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
                                 duration=self.request.get('filter.duration'),
                                 popularity=self.request.get('filter.popularity'),
                                 recency=self.request.get('filter.recency'))
        orderedItems = BaseHandler.getOrderedItems(self,
                                                   self.request.get('publisherUrl'),
                                                   self.viewer.filter)
        self.common_response.setItems(orderedItems, response.ItemInfo.SHORT)
        self.common_response.setFilter(self.viewer.filter)
        BaseHandler.writeResponse(self)

class GetItemStatsHandler(BaseHandler):
    def post(self):
        BaseHandler.initFromRequest(self, self.request)
        itemWithStats = BaseHandler.getItemWithStats(self, self.request.get('publisherUrl'),
                                                     self.request.get('itemId'))
        self.common_response.setItems([itemWithStats], response.ItemInfo.FULL)
        BaseHandler.writeResponse(self)

def main():
    application = webapp.WSGIApplication(
                                         [('/', MainHandler),
                                          ('/submit_item', SubmitItemHandler),
                                          ('/submit_paid_item', SubmitPaidItemHandler),
                                          ('/get_ordered_items', GetOrderedItemsHandler),
                                          ('/get_paid_items', GetPaidItemsHandler),
                                          ('/submit_user_interaction', SubmitUserInteractionHandler),
                                          ('/get_filter', GetFilterHandler),
                                          ('/submit_filter', SubmitFilterHandler),
                                          ('/get_item_stats', GetItemStatsHandler),
                                         ],
                                         debug=True)
    util.run_wsgi_app(application)


if __name__ == '__main__':
    main()

