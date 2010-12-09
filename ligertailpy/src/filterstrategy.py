import model
import logging
import datetime

def applyFilter(items, filter):
  LIKES_RATE_K = 500.0
  CLICKS_RATE_K = 100.0
  CLOSES_RATE_K = -20.0
  TOTAL_LIKES_K = 1.0
  TOTAL_CLICKS_K = 1.0
  TOTAL_CLOSES_K = -1.0
  TOTAL_VIEWS_K = -0.2
  
  RECENCY_K = 1000.0
  PRICE_K = 1000.0
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
    popularity = likesRate * LIKES_RATE_K + \
        clicksRate * CLICKS_RATE_K + \
        closesRate * CLOSES_RATE_K + \
        likes * TOTAL_LIKES_K + \
        clicks * TOTAL_CLICKS_K + \
        closes * TOTAL_CLOSES_K
    seconds = float((today - item.creationTime).seconds)
    recency = RECENCY_K / (seconds+1) 
    item.v = popularity * filter.popularity + \
        recency * filter.recency + \
        views * TOTAL_VIEWS_K + \
        float(item.price) / seconds * PRICE_K
  orderedItems = sorted(items, key=lambda item : item.v, reverse=True)
  return orderedItems  
