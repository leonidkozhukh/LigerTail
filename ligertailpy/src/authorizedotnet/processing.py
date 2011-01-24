##############################################################################
#
# Copyright (c) 2004 Zope Corporation and Contributors.
# All Rights Reserved.
#
# This software is subject to the provisions of the Zope Public License,
# Version 2.1 (ZPL).  A copy of the ZPL should accompany this distribution.
# THIS SOFTWARE IS PROVIDED "AS IS" AND ANY AND ALL EXPRESS OR IMPLIED
# WARRANTIES ARE DISCLAIMED, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
# WARRANTIES OF TITLE, MERCHANTABILITY, AGAINST INFRINGEMENT, AND FITNESS
# FOR A PARTICULAR PURPOSE.
#
##############################################################################

import httplib
import urllib
import md5
import zc.creditcard
import zc.ssl


class TransactionResult(object):
    def __init__(self, fields):
        self.response_code = fields[0]
        self.response = {'1': 'approved', '2': 'declined', '3': 'error',
                         '4': 'held for review'}[self.response_code]
        self.response_reason_code = fields[2]
        self.response_reason = fields[3]
        TESTING_PREFIX = '(TESTMODE) '
        if self.response_reason.startswith(TESTING_PREFIX):
            self.test = True
            self.response_reason = self.response_reason[len(TESTING_PREFIX):]
        else:
            self.test = False
        self.approval_code = fields[4]
        self.trans_id = fields[6]
        self.amount = fields[9]
        self.hash = fields[37]
        self.card_type = None

    def validateHash(self, login, salt):
        value = ''.join([salt, login, self.trans_id, self.amount])
        return self.hash.upper() == md5.new(value).hexdigest().upper()


class AuthorizeNetConnection(object):
    def __init__(self, server, login, key, salt=None, timeout=None):
        self.server = server
        self.login = login
        self.salt = salt
        self.timeout = timeout
        self.delimiter = '|'
        self.standard_fields = dict(
            x_login = login,
            x_tran_key = key,
            x_version = '3.1',
            x_delim_data = 'TRUE',
            x_delim_char = self.delimiter,
            x_relay_response = 'FALSE',
            x_method = 'CC',
            )

    def sendTransaction(self, **kws):
        # if the card number passed in is the "generate an error" card...
        if kws.get('card_num') == '4222222222222':
            # ... turn on test mode (that's the only time that card works)
            kws['test_request'] = 'TRUE'

        body = self.formatRequest(kws)

        if self.server.startswith('localhost:'):
            server, port = self.server.split(':')
            conn = httplib.HTTPConnection(server, port)
        else:
            conn = zc.ssl.HTTPSConnection(self.server, timeout=self.timeout)
        conn.putrequest('POST', '/gateway/transact.dll')
        conn.putheader('content-type', 'application/x-www-form-urlencoded')
        conn.putheader('content-length', len(body))
        conn.endheaders()
        conn.send(body)

        response = conn.getresponse()
        fields = response.read().split(self.delimiter)
        result = TransactionResult(fields)
        
        if (self.salt is not None
        and not result.validateHash(self.login, self.salt)):
            raise ValueError('MD5 hash is not valid (trans_id = %r)'
                             % result.trans_id)

        return result

    def formatRequest(self, params):
        r"""Encode the argument dict into HTTP request form data.

            >>> conn = AuthorizeNetConnection('test.authorize.net',
            ...                               'login','key')
            >>> def display(result):
            ...     print '&\\\n'.join(result.split('&'))
            >>> display(conn.formatRequest({'card_num': '4007000000027',
            ...                             'exp_date': '0530'}))
            x_login=login&\
            x_method=CC&\
            x_card_num=4007000000027&\
            x_tran_key=key&\
            x_version=3.1&\
            x_delim_char=%7C&\
            x_exp_date=0530&\
            x_relay_response=FALSE&\
            x_delim_data=TRUE

        The 'line_items' parameter is handled in a special way.  It is
        expected to be a sequence of sequences.  Each inner sequence
        represents a line_item parameter.  There can be up to 30 of
        them in a single transaction.

            >>> display(conn.formatRequest({'line_items': [
            ...  # item# name       description    qty unitprice taxable
            ...    ('1', 'MD-1000', 'Main device', '1', '99.95', 'Y'),
            ...    ('2', 'AC-100', 'Accessory', '2', '14.95', ''),
            ...    ]}))
            x_login=login&\
            x_version=3.1&\
            x_delim_char=%7C&\
            x_method=CC&\
            x_relay_response=FALSE&\
            x_tran_key=key&\
            x_delim_data=TRUE&\
            x_line_item=1%3C%7C%3EMD-1000%3C%7C%3EMain+device%3C%7C%3E1%3C%7C%3E99.95%3C%7C%3EY&\
            x_line_item=2%3C%7C%3EAC-100%3C%7C%3EAccessory%3C%7C%3E2%3C%7C%3E14.95%3C%7C%3E

        '%3C%7C%3E' is '<|>', the delimiter of line_item fields.
        """

        line_items = []
        if 'line_items' in params:
            line_items = params.pop('line_items')
        fields = dict(('x_'+key, value) for key, value in params.iteritems())
        fields.update(self.standard_fields)
        fields_pairs = fields.items()
        for item in line_items:
            fields_pairs.append(('x_line_item', '<|>'.join(item)))
        return urllib.urlencode(fields_pairs)


class CcProcessor(object):
    def __init__(self, server, login, key, salt=None, timeout=None):
        self.connection = AuthorizeNetConnection(
            server, login, key, salt, timeout)

    def authorize(self, **kws):
        if not isinstance(kws['amount'], basestring):
            raise ValueError('amount must be a string')

        type = 'AUTH_ONLY'

        result = self.connection.sendTransaction(type=type, **kws)
        # get the card_type
        card_num = kws.get('card_num')
        if card_num is not None and len(card_num) >= 4:
            card_type = zc.creditcard.identifyCreditCardType(card_num[:4], len(card_num))
            result.card_type = card_type
        
        return result

    def captureAuthorized(self, **kws):
        type = 'PRIOR_AUTH_CAPTURE'
        return self.connection.sendTransaction(type=type, **kws)

    def credit(self, **kws):
        type = 'CREDIT'
        return self.connection.sendTransaction(type=type, **kws)

    def void(self, **kws):
        type = 'VOID'
        return self.connection.sendTransaction(type=type, **kws)
