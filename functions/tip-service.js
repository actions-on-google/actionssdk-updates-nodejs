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
 * This includes functions to access the Tips database on Firestore.
 */
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const {Tip, NotificationTarget} = require('./shared');
const request = require('request');

/** Collections and fields names in Firestore */
const FirestoreNames = {
  TIPS: 'tips',
  CATEGORY: 'category',
  TIP: 'tip',
  URL: 'url',
  CREATED_AT: 'created_at',
  USERS: 'users',
  INTENT: 'intent',
  USER_ID: 'userId',
};

/*
// Use this instead of initializeDb if running from localhost.
function intiializeDbUsingServiceAccount () {
  const serviceAccount = require('./service-account.json');
  admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
  });
  return admin.firestore();
} */

/**
 * Initializes the firebase database.
 * @return {Object}
 */
function initializeDb() {
  admin.initializeApp();
  return admin.firestore();
}

const db = initializeDb();

/**
 * Adds all tips from the file to Firestore.
 * @return {Promise}
 */
function addTips() {
  const tips = require('./tipsDB.json');
  let batch = db.batch();
  let tipsRef = db.collection(FirestoreNames.TIPS);
  tips.forEach(function(tip) {
    let tipRef = tipsRef.doc();
    batch.set(tipRef, tip);
  });
  return batch.commit()
    .then(function() {
      console.log(`Tips DB succesfully restored`);
    })
    .catch(function(error) {
      throw new Error(`Error restoring tips DB: ${error}`);
    });
}

/**
 * Deletes all tips from the Firestore db.
 * @return {Promise}
 */
function deleteAllTips() {
  return db.collection(FirestoreNames.TIPS)
    .get()
    .then(function(querySnapshot) {
      if (querySnapshot.size > 0) {
        let batch = db.batch();
        querySnapshot.forEach(function(doc) {
          batch.delete(doc.ref);
        });
        batch.commit()
          .then(addTips);
      }
    })
    .catch(function(error) {
      throw new Error(`Firestore query error: ${error}`);
    });
}

// Use this function to restore the content of the tips database.
exports.restoreTipsDB = () => {
  return deleteAllTips().then(addTips);
};

exports.getRandomTip = function(category) {
  let tipsRef = db.collection(FirestoreNames.TIPS);
  if (category) {
    tipsRef = tipsRef.where(FirestoreNames.CATEGORY, '==', category);
  }

  return tipsRef.get().then((querySnapshot) => {
    const tips = querySnapshot.docs;
    if (querySnapshot.size === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * (querySnapshot.size));
    const randomTip = tips[randomIndex];
    return new Tip(
      randomTip.get(FirestoreNames.TIP),
      randomTip.get(FirestoreNames.URL),
      randomTip.get(FirestoreNames.CATEGORY));
  });
};

exports.getLatestTip = function() {
  return db.collection(FirestoreNames.TIPS)
    .orderBy(FirestoreNames.CREATED_AT, 'desc')
    .limit(1)
    .get().then((querySnapshot) => {
      if (querySnapshot.size === 0) {
        return null;
      }
      const tip = querySnapshot.docs[0];
      return new Tip(
        tip.get(FirestoreNames.TIP),
        tip.get(FirestoreNames.URL),
        tip.get(FirestoreNames.CATEGORY));
    });
};

exports.getCategories = () => {
  return db.collection(FirestoreNames.TIPS)
    .get()
    .then((querySnapshot) => {
      return querySnapshot.docs.map((value) => {
        return value.get(FirestoreNames.CATEGORY);
      })
        .filter((value, index, array) => {
          return array.indexOf(value) === index;
        });
    });
};

exports.registerUserForUpdate = (userId, intent) => {
  return db.collection(FirestoreNames.USERS)
    .add({
      [FirestoreNames.INTENT]: intent,
      [FirestoreNames.USER_ID]: userId,
    });
};

/**
 * Returns the notification targets for the specified intent.
 * @param {string} intent
 * @return {Promise}
 */
function getUsersRegisteredForNotification(intent) {
  return db.collection(FirestoreNames.USERS)
    .where(FirestoreNames.INTENT, '==', intent)
    .get()
    .then((querySnapshot) => {
      const notificationTargets = [];
      querySnapshot.forEach((user) => {
        notificationTargets.push(new NotificationTarget(
          user.get(FirestoreNames.USER_ID),
          user.get(FirestoreNames.INTENT)));
      });
      console.log('Notification targets = ', notificationTargets);
      return notificationTargets;
    });
}

/**
 * Authorizes the function to send notifications.
 * @return {Promise}
 */
function authorize() {
  console.log('authorizing ..');
  const { google } = require('googleapis');
  const serviceAccount = require('./service-account.json');
  const jwtClient = new google.auth.JWT(
    serviceAccount.client_email, null, serviceAccount.private_key,
    ['https://www.googleapis.com/auth/actions.fulfillment.conversation'],
    null
  );

  return new Promise((resolve, reject) => {
    jwtClient.authorize((err, tokens) => {
      if (err) {
        console.log('authorization error: ' + err);
        return reject(new Error(`Auth error: ${err}`));
      }
      console.log('authorization success');
      resolve(tokens);
    });
  });
}

/**
 * Sends the notification to the user.
 * @param {NotificationTarget} notification
 * @param {*} authTokens
 * @return {Promise}
 */
function sendNotification(notification, authTokens) {
  console.log('sending notification ', notification);
  return new Promise((resolve, reject) => {
    request.post('https://actions.googleapis.com/v2/conversations:send', {
      'auth': {
        'bearer': authTokens.access_token,
      },
      'json': true,
      'body': {'customPushMessage': notification, 'isInSandbox': true},
    }, function(err, httpResponse, body) {
      if (err) {
        reject(new Error(`API request error: ${err}`));
      } else {
        console.log(httpResponse.statusCode + ': ' +
          httpResponse.statusMessage);
        console.log(JSON.stringify(body));
        resolve(JSON.stringify(body));
      }
    });
  });
}

/**
 * Authorizes and sends a notification to the user.
 * @return {Promise}
 */
function authorizeAndSendNotification() {
  const intent = 'tell.latest.tip';
  let authTokens;

  console.log('about to authorize ..');
  return authorize().then((tokens) => {
    console.log('received authTokens ');
    authTokens = tokens;
    return getUsersRegisteredForNotification(intent);
  })
    .then((notificationTargets) => {
      console.log('received notification targets', notificationTargets);
      const sendPromises = [];
      let notification = {
        userNotification: {
          title: 'AoG tips latest tip',
        },
        target: {},
      };
      notificationTargets.forEach((notificationTarget) => {
        notification.target = notificationTarget;
        sendPromises.push(sendNotification(notification, authTokens));
      });
      return Promise.all(sendPromises);
    })
    .catch((error) => {
      console.log('Error sending notification to users ', error);
    });
}

exports.getUsersRegisteredForNotification = getUsersRegisteredForNotification;

// NOTE: This is exported only to allow testing the flow from a http webhook.
exports.authorizeAndSendNotification = authorizeAndSendNotification;

/**
 * Registers a listener to send a notification to registered users when a new
 * tip is created.
 */
exports.tipCreated =
  functions.firestore.document(`${FirestoreNames.TIPS}/{tipId}`)
    .onCreate((snap, context) => {
      return authorizeAndSendNotification();
    });
