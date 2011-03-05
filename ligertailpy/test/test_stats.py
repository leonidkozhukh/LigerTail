import random
import unittest
import model
import datetime
from model import StatType

class TestTimedStats(unittest.TestCase):

    def setUp(self):
        self.seq = range(10)

    def test_statsCreate(self):
        timedStats = model.TimedStats()
        numAsserted = 0
        numDeltas = 0
        for durid in range(model.YEARLY.id, model.MINUTELY.id + 1):
          numDeltas += model.DurationInfo[durid].num_items
          for i in range (0, model.DurationInfo[durid].num_items):
            for s in range (StatType.BEGIN, StatType.END):
              self.assertEqual(timedStats.durations[durid][i][s], 0)
              numAsserted += 1
        self.assertEqual(numAsserted, numDeltas * 5)

    def test_statsUpdate(self):
      timedStats = model.TimedStats()
      updateTime = datetime.datetime(2010, 10, 10)
      timedStats.update(updateTime, StatType.CLICKS)
      self.assertEqual(timedStats.updateTime, updateTime)
      for durid in range(model.YEARLY.id, model.MINUTELY.id + 1):
        self.assertEqual(timedStats.durations[durid][0][StatType.CLICKS], 1)
         

    def test_statsMultiUpdateSameTime(self):
      timedStats = model.TimedStats()
      updateTime = datetime.datetime(2010, 10, 10)
      timedStats.update(updateTime, StatType.CLICKS)
      timedStats.update(updateTime, StatType.CLICKS)
      timedStats.update(updateTime, StatType.CLICKS)
      timedStats.update(updateTime, StatType.CLOSES)
      self.assertEqual(timedStats.updateTime, updateTime)
      for durid in range(model.YEARLY.id, model.MINUTELY.id + 1):
        self.assertEqual(timedStats.durations[durid][0][StatType.CLICKS], 3)
        self.assertEqual(timedStats.durations[durid][0][StatType.CLOSES], 1)
      
    def test_statsMultiUpdateDiffTime(self):
      timedStats = model.TimedStats()
      updateTime = datetime.datetime(2010, 2, 1, 10, 10)
      timedStats.update(updateTime, StatType.CLICKS)
      updateTime = datetime.datetime(2010, 12, 30, 10, 10)
      timedStats.update(updateTime, StatType.CLICKS)
      updateTime = datetime.datetime(2010, 12, 30, 12, 10)
      timedStats.update(updateTime, StatType.CLICKS)
      updateTime = datetime.datetime(2011, 1, 1, 10)
      timedStats.update(updateTime, StatType.CLICKS)
      updateTime = datetime.datetime(2011, 1, 1, 11, 10)
      timedStats.update(updateTime, StatType.UNIQUES)
      updateTime = datetime.datetime(2011, 1, 1, 11, 18)
      timedStats.update(updateTime, StatType.CLICKS)
      updateTime = datetime.datetime(2011, 1, 1, 12)
      timedStats.update(updateTime)
      
      
      self.assertEqual(timedStats.updateTime, updateTime)
      
      self.assertEqual(timedStats.durations[model.YEARLY.id][0][StatType.CLICKS], 2)
      self.assertEqual(timedStats.durations[model.YEARLY.id][0][StatType.UNIQUES], 1)
      # 3 clicks in 2010
      self.assertEqual(timedStats.durations[model.YEARLY.id][1][StatType.CLICKS], 3)

      self.assertEqual(timedStats.durations[model.MONTHLY.id][0][StatType.CLICKS], 2)
      self.assertEqual(timedStats.durations[model.MONTHLY.id][0][StatType.UNIQUES], 1)
      self.assertEqual(timedStats.durations[model.MONTHLY.id][1][StatType.CLICKS], 2) # dec 
      self.assertEqual(timedStats.durations[model.MONTHLY.id][3][StatType.CLICKS], 0)
      self.assertEqual(timedStats.durations[model.MONTHLY.id][11][StatType.CLICKS], 1) # feb
      
      self.assertEqual(timedStats.durations[model.DAILY.id][0][StatType.CLICKS], 2)
      self.assertEqual(timedStats.durations[model.DAILY.id][0][StatType.UNIQUES], 1)
      self.assertEqual(timedStats.durations[model.DAILY.id][1][StatType.CLICKS], 0)
      self.assertEqual(timedStats.durations[model.DAILY.id][2][StatType.CLICKS], 2)

      self.assertEqual(timedStats.durations[model.HOURLY.id][0][StatType.CLICKS], 0)
      self.assertEqual(timedStats.durations[model.HOURLY.id][1][StatType.CLICKS], 1)
      self.assertEqual(timedStats.durations[model.HOURLY.id][1][StatType.UNIQUES], 1)
      self.assertEqual(timedStats.durations[model.HOURLY.id][2][StatType.CLICKS], 1)

      self.assertEqual(timedStats.durations[model.MINUTELY.id][50][StatType.UNIQUES], 1) #50 min ago
      self.assertEqual(timedStats.durations[model.MINUTELY.id][42][StatType.CLICKS], 1) #42 min ago
      
if __name__ == '__main__':
    unittest.main()