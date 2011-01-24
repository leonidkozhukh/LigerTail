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

def test(itemId):
  api = aim.Api(u"7Tgz75R5zP", u"79myB9H3S489h7Bj", delimiter=u"|", is_test=True)
  result_dict = api.transaction(
                amount=10.00,
                card_num=u"400700000027",
                exp_date=u"2011-07",
                extra_fields={u'itemId': unicode(str(itemId))}
            )
  return result_dict