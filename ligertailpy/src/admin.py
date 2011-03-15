from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
import model
import os
from google.appengine.ext.webapp import template
from filterstrategy import filterStrategy
from activitymanager import activityManager

NEW_ACTIVITY_NAME = 'add_new_activity_here'

class AdminHandler(webapp.RequestHandler):
    def get(self, url):
        user = users.get_current_user()

        if user:
            context = {'user' : user.nickname()}
            if url == 'algorithm.html':
              context['alg'] =  model.getOrderingAlgorithmParams('default')
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
            path = ''
            if len(url) > 0:
              path = os.path.join(os.path.dirname(__file__), 'webadmin', url)
            else:
              path = os.path.join(os.path.dirname(__file__), 'webadmin', 'index.html')
            self.response.out.write(template.render(path, context))

        else:
            self.redirect(users.create_login_url(self.request.uri))
    
    def post(self, url):
      if url == 'update_alg':
        self.updateAlg()
      elif url == 'update_activities':
        self.updateActivities()

    def updateAlg(self):
      params = model.getOrderingAlgorithmParams('default')
      params.update(self.request.get('likes_factor'),
                            self.request.get('clicks_factor'),
                            self.request.get('closes_factor'),
                            self.request.get('total_likes_factor'),
                            self.request.get('total_clicks_factor'),
                            self.request.get('total_closes_factor'),
                            self.request.get('total_views_factor'),
                            self.request.get('recency_factor'),
                            self.request.get('price_factor'))
                            
      filterStrategy.refreshParams()
      self.redirect('algorithm.html?status=updated')
      
      
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
          if activityMap[a.name].updateFrom(a):
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
          
      activityManager.refreshActivities()    
      
      if len(errors):
        self.response.out.write(' / '.join(successes) + 
                                ' / '.join(errors))
      else:
        self.redirect('background.html?status=updated')
  
    
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
  