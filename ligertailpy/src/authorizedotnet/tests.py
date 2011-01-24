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

from zope.testbrowser.browser import Browser
from zope.testing import doctest, renormalizing
import BaseHTTPServer
import ClientForm
import SimpleHTTPServer
import cgi
import httplib
import mechanize
import os
import re
import threading
import unittest

TEST_SERVER_PORT = 30423

class TolerantFormParser(ClientForm.FormParser):
    """A parser that ignores <input> elements outside of forms."""

    def do_input(self, attrs):
        if self._current_form is None:
            return
        return ClientForm.FormParser.do_input(self, attrs)


def makeMechBrowser():
    """Create a mechanize browser

    This tries to paper over two different mechanize APIs, the newest is
    listed first.
    """
    if hasattr(mechanize, 'DefaultFactory'):
        class MyFactory(mechanize.DefaultFactory):
            def __init__(self):
                mechanize.DefaultFactory.__init__(self)
                self._forms_factory=mechanize.FormsFactory(
                    form_parser_class=TolerantFormParser)

        mech_browser = mechanize.Browser(factory=MyFactory())
    else:
        mech_browser = mechanize.Browser(
            forms_factory=mechanize.FormsFactory(
                form_parser_class=TolerantFormParser))

    return mech_browser


class InProcessServer(object):
    info = {}
    last_transaction_id = 0
    seen_auths = []
    seen_captures = []

    def getTransactions(self):
        return self.info


class TestRequestHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):

    def do_POST(self):
        fields = cgi.FieldStorage(fp=self.rfile, headers=self.headers,
                                  environ = {'REQUEST_METHOD':'POST'},
                                  keep_blank_values = 1)

        if fields.getvalue('x_delim_data') != 'TRUE':
            raise ValueError('the test server only knows how to do'
                             ' delimited output')

        if fields.getvalue('x_relay_response') != 'FALSE':
            raise ValueError('AIM requires x_relay_response be "FALSE"')

        required_fields = ('x_login x_tran_key x_version x_delim_char '
                           'x_method').split()
        for f in required_fields:
            if f not in fields:
                raise ValueError('the %r field is required' % f)

        delimiter = fields['x_delim_char'].value

        self.send_response(200)
        self.send_header('Content-Type', 'text/plain')
        self.end_headers()

        out = getattr(self, fields['x_type'].value)(fields)
        self.wfile.write(delimiter.join(out))

    @staticmethod
    def makeOut(response_code, reason_text, approval_code, trans_id, amount):
        hash = 'DEADBEEF'
        out = [''] * 38
        out[:9] = [response_code, '', '', reason_text, approval_code, '',
                trans_id, '', '', amount]
        out[37] = hash
        return out

    def getTransactionId(self):
        in_process_server.last_transaction_id += 1
        return '%09d' % in_process_server.last_transaction_id

    def AUTH_ONLY(self, fields):
        amount = fields.getvalue('x_amount')
        card_num = fields.getvalue('x_card_num')
        expr = fields.getvalue('x_exp_date')

        response_code = '1'
        reason_text = 'This transaction has been approved.'
        approval_code = '123456'
        trans_id = self.getTransactionId()

        if expr[2:4] > '80':
            response_code = '3'
            reason_text = 'The credit card has expired.'

        if card_num == '4222222222222' and amount.split('.')[0] == '27':
            response_code = '2'
            reason_text = ('The transaction resulted in an AVS mismatch. The'
                           ' address provided does not match billing address'
                           ' of cardholder.')

        invoice_num = fields.getvalue('x_invoice_num')
        txn_hash = (amount, card_num, invoice_num)
        if txn_hash in in_process_server.seen_auths:
            response_code = '3'
            reason_text = 'A duplicate transaction has been submitted.'

        out = self.makeOut(response_code, reason_text, approval_code,
                           trans_id, amount)

        if txn_hash not in in_process_server.seen_auths:
            in_process_server.seen_auths.append(txn_hash)
            in_process_server.info[trans_id] = 'Authorized/Pending Capture'

        return out

    def CREDIT(self, fields):
        trans_id = fields.getvalue('x_trans_id')

        response_code = '3'
        reason_text = 'The referenced transaction does not meet the criteria for issuing a credit.'
        approval_code = '123456'
        out = self.makeOut(response_code, reason_text, approval_code,
                           trans_id, amount='')
        in_process_server.info[trans_id] = 'XXX'
        return out

    def VOID(self, fields):
        trans_id = fields.getvalue('x_trans_id')

        response_code = '1'
        reason_text = 'This transaction has been approved.'
        approval_code = '123456'
        out = self.makeOut(response_code, reason_text, approval_code,
                           trans_id, amount='')
        in_process_server.info[trans_id] = 'Voided'
        return out

    prev_captures = []
    def PRIOR_AUTH_CAPTURE(self, fields):
        trans_id = fields.getvalue('x_trans_id')
        duplicate_window = fields.getvalue('x_duplicate_window')

        response_code = '1'
        reason_text = 'This transaction has been approved.'
        approval_code = '123456'

        if (trans_id in in_process_server.seen_captures
        and duplicate_window != '0'):
            response_code = '3'
            reason_text = 'This transaction has already been captured.'

        out = self.makeOut(response_code, reason_text, approval_code,
                           trans_id, amount='')

        if trans_id not in in_process_server.seen_captures:
            in_process_server.seen_captures.append(trans_id)
            in_process_server.info[trans_id] = 'Captured/Pending Settlement'

        return out

    def do_QUIT(self):
        self.send_response(200)
        self.end_headers()
        self.server.stop = True

    def log_message(self, format, *args):
        pass


class TestHttpServer(BaseHTTPServer.HTTPServer):

    def serve_forever (self):
        """Handle one request at a time until stopped."""
        self.stop = False
        while not self.stop:
            self.handle_request()


in_process_server = InProcessServer()

def localSetUp(test):
    global http_server
    http_server = TestHttpServer(('localhost', TEST_SERVER_PORT),
                                 TestRequestHandler)
    http_server.thread = threading.Thread(target=http_server.serve_forever)
    http_server.thread.start()
    test.globs['LOGIN'] = 'LOGIN'
    test.globs['KEY'] = 'KEY'

def localTearDown(test):
    conn = httplib.HTTPConnection('localhost:%d' % TEST_SERVER_PORT)
    conn.request('QUIT', '/')
    conn.getresponse()
    http_server.thread.join()


def remoteSetUp(test):
    login = os.environ.get('AUTHORIZE_DOT_NET_LOGIN')
    password = os.environ.get('AUTHORIZE_DOT_NET_PASSWORD')
    key = os.environ.get('AUTHORIZE_DOT_NET_TRANSACTION_KEY')

    if login is None or password is None or key is None:
        raise RuntimeError('all of AUTHORIZE_DOT_NET_LOGIN,'
                           ' AUTHORIZE_DOT_NET_PASSWORD, and'
                           ' AUTHORIZE_DOT_NET_TRANSACTION_KEY must be'
                           ' provided in order to run the zc.authorizedotnet'
                           ' tests against the Authorize.Net test server.')

    test.globs['LOGIN'] = login
    test.globs['KEY'] = key


def test_suite():
    checker = renormalizing.RENormalizing([
        (re.compile(r"'.{6}'"), "'123456'"), # for approval codes
        (re.compile(r"'\d{9}'"), "'123456789'"), # for transaction IDs
        ])

    remote = doctest.DocFileSuite(
            'README.txt',
            globs = dict(
                SERVER_NAME='test.authorize.net',
                ),
            optionflags = doctest.NORMALIZE_WHITESPACE | doctest.ELLIPSIS,
            checker = checker,
            setUp = remoteSetUp,
            )
    remote.level = 5
    local = doctest.DocFileSuite(
            'README.txt',
            globs = dict(
                SERVER_NAME='localhost:%s' % TEST_SERVER_PORT,
                ),
            optionflags = doctest.NORMALIZE_WHITESPACE | doctest.ELLIPSIS,
            checker = checker,
            setUp = localSetUp,
            tearDown = localTearDown,
            )
    unit = doctest.DocTestSuite('zc.authorizedotnet.processing',
                                optionflags=doctest.ELLIPSIS)
    return unittest.TestSuite((local, remote, unit))

if __name__ == '__main__':
    unittest.main(defaultTest='test_suite')
