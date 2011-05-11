import random
import unittest
import model
import datetime
import filterstrategy

class TestAlgorithm(unittest.TestCase):

    #def setUp(self):
    #    self.seq = range(10)

    def test_combineTiers(self):
      # Equally interleave t2 and t3
      ordered = filterstrategy.combineTiers_([1,2,3], [4,5,6], [7,9,11], [8,10,12], 0.51)
      self.assertEqual([1,2,3,4,5,6,7,8,9,10,11,12], ordered)

      # empty t0
      ordered = filterstrategy.combineTiers_([], [4,5,6], [7,9,11], [8,10,12], 0.51)
      self.assertEqual([4,5,6,7,8,9,10,11,12], ordered)

      # empty t1
      ordered = filterstrategy.combineTiers_([1,2,3], [], [7,9,11], [8,10,12], 0.51)
      self.assertEqual([1,2,3,7,8,9,10,11,12], ordered)
      
      # empty t3
      ordered = filterstrategy.combineTiers_([1,2,3], [4,5,6], [], [8,10,12], 0.51)
      self.assertEqual([1,2,3,4,5,6,8,10,12], ordered)
      
      # empty t4
      ordered = filterstrategy.combineTiers_([1,2,3], [4,5,6], [7,9,11], [], 0.51)
      self.assertEqual([1,2,3,4,5,6,7,9,11], ordered)
      
      # ratio is 0 (t4, t3)
      ordered = filterstrategy.combineTiers_([], [], [1,2,3], [4,5,6], 0)
      self.assertEqual([4,5,6,1,2,3], ordered)

      # ratio is 1 (t3, t4)
      ordered = filterstrategy.combineTiers_([], [], [1,2,3], [4,5,6], 1)
      self.assertEqual([1,2,3,4,5,6], ordered)

      # ratio is 0.49 - t3 goes first, and alternate
      ordered = filterstrategy.combineTiers_([], [], [1,2,3], [4,5,6], 0.49)
      self.assertEqual([4,1,5,2,6,3], ordered)
      
      # ratio is 2/3
      ordered = filterstrategy.combineTiers_([], [], [1,2,3,4], [5,6,7,8], 0.67)
      self.assertEqual([1,5,2,3,6,4,7,8], ordered)
      
      # ratio is 1/4
      ordered = filterstrategy.combineTiers_([], [], [1,2,3,4], [5,6,7,8], 0.24)
      self.assertEqual([5,1,6,7,8,2,3,4], ordered)
      
      # uneven sizes
      # ratio is 2/3
      ordered = filterstrategy.combineTiers_([], [], [1,2,3,4], [5], 0.67)
      self.assertEqual([1,5,2,3,4], ordered)
      
      # uneven sizes
      # ratio is 1/3
      ordered = filterstrategy.combineTiers_([], [], [1,2,3,4], [5,6], 0.32)
      self.assertEqual([5,1,6,2,3,4], ordered)



if __name__ == '__main__':
    unittest.main()