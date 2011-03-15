import model
import logging
import datetime

class Singleton(object):
  """ A Pythonic Singleton """
  def __new__(cls, *args, **kwargs):
    if '_inst' not in vars(cls):
      cls._inst = object.__new__(cls, *args, **kwargs)
    return cls._inst

class DefaultFilterStrategy(Singleton):
  def __init__(self, id):
    self.params = None
    self.id = id
    self.refreshParams = True
    
  def refreshParams(self):
    self.refreshParams = True
    
  def applyFilter(self, items, filter):    
    if not self.params or self.refreshParams:
      self.params = model.getOrderingAlgorithmParams(self.id)
      self.refreshParams = False
    #TODO: support timeliness
    today = datetime.datetime.today()
    for item in items:
      likes = float(item.stats[model.StatType.LIKES])
      closes = float(item.stats[model.StatType.CLOSES])
      views = float(item.stats[model.StatType.VIEWS])
      clicks = float(item.stats[model.StatType.CLICKS])
      likesRate = 0.0
      clicksRate = 0.0
      closesRate = 0.0
      if views:
        likesRate = likes/views
        closesRate = closes/views
        clicksRate = clicks/views
      popularity = likesRate * self.params.likes_factor + \
          clicksRate * self.params.clicks_factor + \
          closesRate * self.params.closes_factor + \
          likes * self.params.total_likes_factor + \
          clicks * self.params.total_clicks_factor + \
          closes * self.params.total_closes_factor
      seconds = float((today - item.creationTime).seconds) + 1
      recency = self.params.recency_factor / seconds 
      item.v = popularity * filter.popularity + \
          recency * filter.recency + \
          views * self.params.total_views_factor + \
          float(item.price) / seconds * self.params.price_factor
    orderedItems = sorted(items, key=lambda item : item.v, reverse=True)
    return orderedItems  

filterStrategy = DefaultFilterStrategy('default')