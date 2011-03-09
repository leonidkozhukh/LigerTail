from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
import model
import os
from google.appengine.ext.webapp import template
from filterstrategy import filterStrategy

class AdminHandler(webapp.RequestHandler):
    
    def get(self, url):
        user = users.get_current_user()

        if user:
            context = {'user' : user.nickname(),
                       'alg' : model.getOrderingAlgorithmParams('default')}
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
      self.redirect('index.html?status=updated')