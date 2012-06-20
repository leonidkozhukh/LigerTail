from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext import db
import model
import os
from defaultitemlist import defaultItemList
from google.appengine.ext.webapp import template
from filterstrategy import filterStrategy
from activitymanager import activityManager


NEW_ACTIVITY_NAME = 'add_new_activity_here'

class AdminHandler(webapp.RequestHandler):
    def get(self, url):
        user = users.get_current_user()
            
        if user and users.is_current_user_admin():
            context = {'user' : user.nickname()}
            logout_url = users.create_logout_url(self.request.uri)
            context['logout_url'] = logout_url
            if url == 'algorithm.html':
              context['alg'] =  model.getOrderingAlgorithmParams()
            elif url == 'background.html':
              activities = model.getActivities(False)
              i = 0
              for activity in activities:
                activity.index = i
                i += 1
              newActivity = model.ActivityParams()
              newActivity.name = NEW_ACTIVITY_NAME
              newActivity.activity_load = 0
              newActivity.index = i
              newActivity.num_buckets = 0
              newActivity.total_updates_before_triggering = 0
              newActivity.enabled = False
              newActivity.min_time_sec_between_jobs = 0
              newActivity.max_time_sec_before_triggering = 0
              activities.append(newActivity)
              context['activities'] = activities
              context['timePeriod'] = activityManager.getActivityPeriod()
            elif url =='publishers.html':
              publishers = model.getPublisherSites()
              context['publishers'] = publishers
            elif url =='paymentsconfig.html':
              context['paymentparams'] = model.getPaymentConfig()
            elif url =='ligerpediaconfig.html':
              context['ligerpediaconfig'] = model.getLigerpediaConfig()
            elif url =='defaultlinks.html':
              config = model.getDefaultLinksConfig()
              context['publisher'] = model.getPublisherSite(config.default_links_url)
              context['defaultlinksconfig'] = config
              items = defaultItemList.getOrderedItems()
              views = 0
              for item in items:
                views += item.stats[model.StatType.VIEWS]
              context['items'] = items
              context['totalviews'] = views
            path = ''
            if url and len(url) > 0:
              path = os.path.join(os.path.dirname(__file__), 'webadmin', url)
            else:
              path = os.path.join(os.path.dirname(__file__), 'webadmin', 'index.html')
            self.response.out.write(template.render(path, context))
        elif user and users.is_current_user_admin() == False:
            context = {'user' : user.nickname()}
            login_url = users.create_login_url(self.request.uri)
            context['login_url'] = login_url
            path = os.path.join(os.path.dirname(__file__), 'webadmin', 'unauthorized.html')
            self.response.out.write(template.render(path, context))
        else:
            self.redirect(users.create_login_url(self.request.uri))
    
    def post(self, cmd):
      if cmd == 'update_alg':
        self.updateAlg()
      elif cmd == 'update_activities':
        self.updateActivities()
      elif cmd == 'update_paymentconfig':
        self.updatePaymentConfig()
      elif cmd == 'update_ligerpediaconfig':
        self.updateLigerpediaConfig()
      elif cmd == 'update_defaultlinksconfig':
        self.updateDefaultLinksConfig()
      elif cmd == 'delete_item':
        self.deleteItem()
      elif cmd == 'delete_table_spot':
        self.deleteTableSpot()
      elif cmd == 'delete_table_bucket':
        self.deleteTableBucket()
      elif cmd == 'delete_table_item':
        self.deleteTableItem()
      elif cmd == 'delete_table_publishersite':
        self.deleteTablePublisherSite()
      elif cmd == 'delete_table_viewer':
        self.deleteTableViewer()
      elif cmd == 'delete_tables_all':
        self.deleteTablesAll()

    def updateAlg(self):
      params = model.getOrderingAlgorithmParams()
      err = params.update(float(self.request.get('t1_eng')),
                          float(self.request.get('t2_eng')),
                          int(self.request.get('num_views')),
                          float(self.request.get('ctr_factor')),
                          float(self.request.get('t2_t3_ratio')))
      if (err == ''):                      
        filterStrategy.refreshParams()
        self.redirect('algorithm.html?status=updated')
      else:
        self.response.out.write(err)
        
    def updatePaymentConfig(self):
      config = model.getPaymentConfig()
      
      if self.request.get('test'):
        config.test_mode = True
      else:
        config.test_mode = False
      if self.request.get('email'):
        config.send_email = True
      else:
        config.send_email = False
      config.put()
    
    def deleteItem(self):
      id = int(self.request.get('id'))
      if id:
        item = model.Item.get_by_id(id)
        item.delete()
        self.redirect('defaultlinks.html?status=updated')

    def deleteTableSpot(self):
       query = model.Spot.all()
       i = self.deleteAll(query)
       # db.delete(model.Spot.all())
       self.redirect('deletedbs.html?status=deleted_spot&' + str(i))

    def deleteTableBucket(self):
       query = model.Bucket.all()
       i = self.deleteAll(query)
       # db.delete(model.Bucket.all())
       self.redirect('deletedbs.html?status=deleted_bucket&' + str(i))

    def deleteTableItem(self):
       query = model.Item.all()
       i = self.deleteAll(query)
       #db.delete(model.Item.all())
       self.redirect('deletedbs.html?status=deleted_item&' + str(i))

    def deleteTablePublisherSite(self):
       query = model.PublisherSite.all()
       i = self.deleteAll(query);
       #db.delete(model.PublisherSite.all())
       self.redirect('deletedbs.html?status=deleted_publisherSite&' + str(i))

    def deleteTableViewer(self):
       query = model.Viewer.all()
       i = self.deleteAll(query)
       #db.delete(model.Viewer.all())
       self.redirect('deletedbs.html?status=deleted_viewer&' + str(i))
 
    def deleteTablesAll(self):
       query = model.Viewer.all()
       self.deleteAll(query)
       query = model.Spot.all()
       self.deleteAll(query)
       query = model.Item.all()
       self.deleteAll(query)
       query = model.Bucket.all()
       self.deleteAll(query)
       query = model.PublisherSite.all()
       self.deleteAll(query);
       
       #db.delete(model.Viewer.all())
       #db.delete(model.Spot.all())
       #db.delete(model.Item.all())
       #db.delete(model.Bucket.all())
       #db.delete(model.PublisherSite.all())
       self.redirect('deletedbs.html?status=deleted_all')
      
    def deleteAll(self, query):
      i = 0
      try:
        while i <= 4:
          i+=1
          entries = query.fetch(500)
          db.delete(entries)
        return i*500
      except StopIteration:
        return i*500
       
      
    def updateLigerpediaConfig(self):
      config = model.getLigerpediaConfig()
      config.embedly_request_links_total = int(self.request.get('links_total'))
      config.embedly_request_timeout = int(self.request.get('timeout'))
      config.put()
      self.redirect('ligerpediaconfig.html?status=updated')
   
    def updateDefaultLinksConfig(self):
      config = model.getDefaultLinksConfig()
      config.enable = bool(self.request.get('enable'))
      url = str(self.request.get('url')).lower()
      config.default_links_url = url
      config.refresh_period_sec = int(self.request.get('refresh'))
      config.throttle = int(self.request.get('throttle'))
      config.throttle_outgoing = bool(self.request.get('outgoing'))
      config.put()
      self.redirect('defaultlinks.html?status=updated')
   
    def updateActivities(self):
      errors = []
      successes = []
      index = 0
      activities = []
      
      activity = self.retrieveActivity(index)
      while activity:
        if activity and activity.name != NEW_ACTIVITY_NAME:
          errorMsg = activity.getErrors()
          if errorMsg != '':
            errors.append('ERROR %s %s' % (activity.name, errorMsg))
          else:
            activities.append(activity)
        index += 1
        activity = self.retrieveActivity(index)
      
      activityMap = {}
      existingActivities = model.getActivities(False)
      for a in existingActivities:
        activityMap[a.name] = a
      
      for a in activities:
        if activityMap.has_key(a.name):
          if activityMap[a.name] and activityMap[a.name].updateFrom(a):
            successes.append('UPDATED: %s' % a.name)
            activityMap[a.name].put()
          activityMap[a.name] = None
        else:
          a.put()
          successes.append('CREATED: %s' % a.name)
      for a in activityMap.values():
        if a:
          successes.append('DELETED: %s' % a.name)
          a.delete()
                
      self.response.out.write(' / '.join(successes) + 
                                ' / '.join(errors))
      #else:
      #  self.redirect('background.html?status=updated')
  
    
    def retrieveActivity(self, index):
      postfix = '__' + str(index)
      name = self.request.get('name' + postfix)
      if name:
        enabled = self.request.get('enabled' + postfix)
        load = self.request.get('load' + postfix)
        buckets = self.request.get('buckets' + postfix)
        updates = self.request.get('updates' + postfix)
        mintime = self.request.get('mintime' + postfix)
        maxtime = self.request.get('maxtime' + postfix)
        if not load:
          load = 0
        if not buckets:
          buckets = 0
        if not updates:
          updates = 0
        if not mintime:
          mintime = 0
        if not maxtime:
          maxtime = 0
        activity = model.ActivityParams()
        activity.update(int(load), name, int(buckets), int(updates), bool(enabled), int(mintime), int(maxtime))
        return activity
      return None
  