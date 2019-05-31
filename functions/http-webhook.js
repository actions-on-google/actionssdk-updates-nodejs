// Copyright 2018, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Core apis of the tip-service as HTTP functions.
 */

'use strict';

const functions = require('firebase-functions');

const {
  getRandomTip,
  getLatestTip,
  getCategories,
  restoreTipsDB,
  getUsersRegisteredForNotification,
  authorizeAndSendNotification,
} = require('./tip-service');

exports.tellRandomTip = functions.https.onRequest((req, res) => {
  const category = req.param('category');
  getRandomTip(category).then((tip) => {
    res.send('Random tip = ' + tip.tip);
  });
});

exports.tellLatestTip = functions.https.onRequest((req, res) => {
  getLatestTip().then((tip) => {
    res.send('Latest tip = ' + tip.tip);
  });
});

exports.getCategories = functions.https.onRequest((req, res) => {
  getCategories().then((categories) => {
    res.send(categories.join(', '));
  });
});

exports.restoreTipsDB = functions.https.onRequest((req, res) => {
  restoreTipsDB().then(() => {
    res.send('Successfully restored the database.');
  }).then((message) => {
    res.send('Unable to restore database - ' + message);
  });
});

exports.getUsersRegisteredForNotification =
  functions.https.onRequest((req, res) => {
    const intent = req.param('intent');
    getUsersRegisteredForNotification(intent).then((targets) => {
      res.send(
        targets.map((target) => target.userId + '/' + target.intent));
    });
  });

exports.authorizeAndSendNotification =
  functions.https.onRequest((req, res) => {
    authorizeAndSendNotification().then((result) => {
      console.log('http-webhook: authorizeAndSendNotification: ', result);
      res.send('send notification successful');
    });
  });
