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
  def __init__(self):
    self.params = None
    self.doRefreshParams = True
    # TODO: expose timeliness to admin UI
    self.timeliness = None #None for infinite (total), otherwise DurationInfo type
    
  def refreshParams(self):
    self.doRefreshParams = True
    
  # See OrderingAlgorithmParams for the algorithm description.
  def applyFilter(self, items, filter):    
    if not self.params or self.doRefreshParams:
      self.params = model.getOrderingAlgorithmParams()
      self.doRefreshParams = False
    tier0 = []
    tier1 = []
    tier2 = []
    tier3 = []
    #TODO: support timeliness
    #TODO: support likes
    for item in items:
      # likes = float(item.stats[model.StatType.LIKES])
      closes = self.getCloses_(item)
      views = self.getViews_(item)
      clicks = self.getClicks_(item)
      engagement = 0
      if views > 0:
        engagement = clicks * self.params.ctr_factor + closes * (1-self.params.ctr_factor)
      item.engagement = engagement
      if views < self.params.num_views_threshold and item.price > 0:
        tier0.append(item)
        item.tier = 0
        continue
      if views >= self.params.num_views_threshold and engagement >= self.params.tier1_engagement_threshold:
        tier1.append(item)
        item.tier = 1
        continue
      if engagement >= self.params.tier2_engagement_threshold:
        tier2.append(item)
        item.tier = 2
        continue
      if views < self.params.num_views_threshold:
        item.tier = 3
        tier3.append(item)
        continue
    sortedTier0 = sorted(tier0, key = lambda item : item.price, reverse=True)
    sortedTier1 = sorted(tier1, key = lambda item : item.engagement, reverse=True)
    sortedTier2 = sorted(tier2, key = lambda item : item.engagement, reverse=True)
    sortedTier3 = sorted(tier3, key = lambda item : self.getViews_(item))
    return combineTiers_(sortedTier0, sortedTier1, sortedTier2, sortedTier3,
                         self.params.tier2_tier3_ratio)


  def getCloses_(self, item):
    return float(item.stats[model.StatType.CLOSES])  
  def getViews_(self, item):
    return float(item.stats[model.StatType.VIEWS])
        
  def getClicks_(self, item):
    return  float(item.stats[model.StatType.CLICKS])
      

def combineTiers_(t0, t1, t2, t3, t2_t3_ratio):
  orderedItems = t0
  orderedItems.extend(t1)
  ratio = 0.5
  i = 0
  j = 0
  skipTier2 = False
  if t2_t3_ratio < 0.5:
    skipTier2 = True
  while i < len(t2) and j < len(t3):
    if not skipTier2:    
      while ratio <= t2_t3_ratio and i < len(t2):
        orderedItems.append(t2[i])
        i+= 1
        ratio = float(i) / (i + j)
    else:
      skipTier2 = False
    while ratio >= t2_t3_ratio and j < len(t3):
      orderedItems.append(t3[j])
      j+=1
      ratio = float(i) / (i + j)
  if i < len(t2):
    orderedItems.extend(t2[i:])
  elif j < len(t3):
    orderedItems.extend(t3[j:])
  return orderedItems  

filterStrategy = DefaultFilterStrategy()