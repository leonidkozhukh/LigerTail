# set your secret key: remember to change this to your live secret key in production
# see your keys here https://manage.stripe.com/account
import stripe
stripe.api_key = "E7zh7YrJ82qASsn7NKa4fhMvsMxvyQZr"




###
#        paymentInfo = {'price': request.get('price'),
#                      'itemId': request.get('itemId'),
#                      'itemUrl'
#                      'token'
#                      'cc': request.get('cc'),
#                      'expiration': request.get('expiration'),
#                      'cvs': request.get('cvs') };
###
def charge(paymentInfo, is_test=True):
  # create the charge on Stripe's servers - this will charge the user's card
  charge = stripe.Charge.create(
    amount = int(paymentInfo['price']) * 100, # amount in cents, again
    currency="usd",
    card=paymentInfo['token'],
    description="$%s for itemId %s %s" % (paymentInfo['price'], paymentInfo['itemId'], paymentInfo['itemUrl']))

  return charge
