#public key:
#MIIBuDCCASwGByqGSM44BAEwggEfAoGBAP1/U4EddRIpUt9KnC7s5Of2EbdSPO9EAMMeP4C2USZpRV1AIlH7WT2NWPq/xfW6MPbLm1Vs14E7gB00b/JmYLdrmVClpJ+f6AR7ECLCT7up1/63xhv4O1fnxqimFQ8E+4P208UewwI1VBNaFpEy9nXzrith1yrv8iIDGZ3RSAHHAhUAl2BQjxUjC8yykrmCouuEC/BYHPUCgYEA9+GghdabPd7LvKtcNrhXuXmUr7v6OuqC+VdMCz0HgmdRWVeOutRZT+ZxBxCBgLRJFnEj6EwoFhO3zwkyjMim4TwWeotUfI0o4KOuHiuzpnWRbqN/C/ohNWLx+2J6ASQ7zKTxvqhRkImog9/hWuWfBpKLZl6Ae1UlZAFMO/7PSSoDgYUAAoGBAO1BHl6ajt5XvoB6CpubYQF4MCf94FscetCmkACU4fgnRCBgcNP/TZUH/nYnd8PBOAZbzKYOOlIiRSRfwjcsobe35aV3vvHPO44dy7YMYx6U+lh4qvuyb3r9kferoIgMPUIXbQMk6QWcrcN4Qiu/jlybvZ/AM5Uq++W+PVino+8E

#private key:
#MIIBSwIBADCCASwGByqGSM44BAEwggEfAoGBAP1/U4EddRIpUt9KnC7s5Of2EbdSPO9EAMMeP4C2USZpRV1AIlH7WT2NWPq/xfW6MPbLm1Vs14E7gB00b/JmYLdrmVClpJ+f6AR7ECLCT7up1/63xhv4O1fnxqimFQ8E+4P208UewwI1VBNaFpEy9nXzrith1yrv8iIDGZ3RSAHHAhUAl2BQjxUjC8yykrmCouuEC/BYHPUCgYEA9+GghdabPd7LvKtcNrhXuXmUr7v6OuqC+VdMCz0HgmdRWVeOutRZT+ZxBxCBgLRJFnEj6EwoFhO3zwkyjMim4TwWeotUfI0o4KOuHiuzpnWRbqN/C/ohNWLx+2J6ASQ7zKTxvqhRkImog9/hWuWfBpKLZl6Ae1UlZAFMO/7PSSoEFgIUTJMMVpuJAa3mDF/Rj2pBS9b1J0I=
'''
#signature:
#MCwCFDCdL7EJGw6LBuNsq2FeICdAdkQsAhRg79dImC3t4pZywY3TQCN0M65NOg==
import sha
import base64
import Crypto
#import Crypto.Util
from Crypto.PublicKey import DSA

def test():
  verified = verifySignature("this is my string",
                             "MCwCFDCdL7EJGw6LBuNsq2FeICdAdkQsAhRg79dImC3t4pZywY3TQCN0M65NOg==",
                             "MIIBuDCCASwGByqGSM44BAEwggEfAoGBAP1/U4EddRIpUt9KnC7s5Of2EbdSPO9EAMMeP4C2USZpRV1AIlH7WT2NWPq/xfW6MPbLm1Vs14E7gB00b/JmYLdrmVClpJ+f6AR7ECLCT7up1/63xhv4O1fnxqimFQ8E+4P208UewwI1VBNaFpEy9nXzrith1yrv8iIDGZ3RSAHHAhUAl2BQjxUjC8yykrmCouuEC/BYHPUCgYEA9+GghdabPd7LvKtcNrhXuXmUr7v6OuqC+VdMCz0HgmdRWVeOutRZT+ZxBxCBgLRJFnEj6EwoFhO3zwkyjMim4TwWeotUfI0o4KOuHiuzpnWRbqN/C/ohNWLx+2J6ASQ7zKTxvqhRkImog9/hWuWfBpKLZl6Ae1UlZAFMO/7PSSoDgYUAAoGBAO1BHl6ajt5XvoB6CpubYQF4MCf94FscetCmkACU4fgnRCBgcNP/TZUH/nYnd8PBOAZbzKYOOlIiRSRfwjcsobe35aV3vvHPO44dy7YMYx6U+lh4qvuyb3r9kferoIgMPUIXbQMk6QWcrcN4Qiu/jlybvZ/AM5Uq++W+PVino+8E")

def verifySignature(data, signatureBase64, publicKeyBase64):
  dsapub = DSA.load_pub_key(base64.decode(publicKeyBase64))
  verified = dsapub.verify_asn1(sha.sha(data).digest(), base64.decode(signatureBase64))

'''
import authorize
from authorize import aim

###
#        paymentInfo = {'price': request.get('price'),
#                      'first_name': request.get('first_name'),
#                      'last_name': request.get('last_name'),
#                      'itemId': request.get('itemId'),
#                      'itemUrl'
#                      'address': request.get('address'),
#                      'city': request.get('city'),
#                      'state': request.get('state'),
#                      'zip': request.get('zip'),
#                      'cc': request.get('cc'),
#                      'expiration': request.get('expiration'),
#                      'cvs': request.get('cvs') };
###
def verify(paymentInfo, is_test=True):
  api = None
  #TODO: store in DB
  if is_test:
    api = aim.Api(u"7Tgz75R5zP", u"79myB9H3S489h7Bj", delimiter=u"|", is_test=is_test)
  else:
    api = aim.Api(u"4xjE9pqUH3D", u"4hhn8VTA6x47ex38", delimiter=u"|", is_test=is_test)
  result_dict = api.transaction(
                amount=u'%s' % paymentInfo['price'],
                card_num=u'%s' % paymentInfo['cc'],
                exp_date=u'%s' % paymentInfo['expiration'],
                extra_fields={u'itemId': unicode(paymentInfo['itemId'])},
                x_first_name=u'%s' % paymentInfo['first_name'],
                x_last_name=u'%s' % paymentInfo['last_name'],
                x_card_code=u'%s' % paymentInfo['cvs'],
                x_line_item=u'%s|%s|%s' %(paymentInfo['itemId'], 'LigerTail link', paymentInfo['itemUrl']),
                x_address=u'%s' % paymentInfo['address'],
                x_city=u'%s' % paymentInfo['city'],
                x_state=u'%s' % paymentInfo['state'],
                x_country=u'United States',
                x_zip=u'%s' % paymentInfo['zip']
            )
  return result_dict