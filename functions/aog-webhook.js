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

'use strict';

const functions = require('firebase-functions');

const {
  actionssdk,
  BasicCard,
  Button,
  RegisterUpdate,
  Suggestions,
  UpdatePermission,
} = require('actions-on-google');

const {
  getRandomTip,
  getLatestTip,
  getCategories,
  registerUserForUpdate,
} = require('./tip-service');

const app = actionssdk({debug: true});

/** Query pattern parameters */
const Parameters = {
  CATEGORY: 'category',
  UPDATE_INTENT: 'UPDATE_INTENT',
};

/** App strings */
const RANDOM_CATEGORY = 'random';
const RECENT_TIP = 'most recent';
const CATEGORIES = 'categories';
const DAILY_NOTIFICATION_SUGGESTION = 'Register for daily updates';
const ASK_CATEGORY_FLAG = 'ask_category';
const PUSH_NOTIFICATION_SUGGESTION = 'Alert me of new tips';
const DAILY_NOTIFICATION_ASKED = 'daily_notification_asked';
const PUSH_NOTIFICATION_ASKED = 'push_notification_asked';

const MSG_AUDIO_WELCOME = 'Hi! Welcome to Actions on Google Tips! I can' +
  ' offer you tips for Actions on Google. To hear the most recent tip, say' +
  ' "most recent". To hear a random tip, say "random". ';

const MSG_WELCOME_MESSAGE = 'Hi! Welcome to Actions on Google Tips! I can' +
  ' offer you tips for Actions on Google.';

const MSG_NO_TIP = 'Unfortunately there are no tips to offer at this time.' +
  ' Please check again later.';

/**
 * @param {Conversation} conv
 * @return {boolean} Whether screen output is supported.
 */
function hasScreenOutput(conv) {
  return conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT');
}

/**
 * @param {*} conv
 * @param {*} tip
 * @return {Promise}
 */
function renderTip(conv, tip) {
  if (!tip) {
    return conv.ask(MSG_NO_TIP);
  }
  if (!hasScreenOutput(conv)) {
    return conv.close(tip.tip);
  }
  conv.ask(
    tip.tip,
    new BasicCard({
      text: tip.tip,
      buttons: new Button({
        title: 'Learn More!',
        url: tip.url,
      }),
    }));
}

/**
 * @param {Conversation} conv
 * @return {Promise}
 */
function renderCategories(conv) {
  return getCategories().then((categories) => {
    categories.push(RANDOM_CATEGORY);
    categories.push(RECENT_TIP);
    conv.ask(
      'Please select a category',
      new Suggestions(categories));
  });
}

/**
 * @param {Conversation} conv
 * @param {string} category
 * @return {Promise}
 */
function tellRandomTip(conv, category) {
  console.log('tellRandomTip for category - ' + category);
  return getRandomTip(category)
  .then(renderTip.bind(null, conv))
  .then(() => {
    if (!conv.user.storage[DAILY_NOTIFICATION_ASKED]) {
      conv.ask(new Suggestions(DAILY_NOTIFICATION_SUGGESTION));
      conv.user.storage[DAILY_NOTIFICATION_ASKED] = true;
    }
  });
}

/**
 * @param {Conversation} conv
 * @return {Promise}
 */
function tellLatestTip(conv) {
  console.log('tellLatestTip ');
  return getLatestTip()
  .then(renderTip.bind(null, conv))
  .then(() => {
    if (!conv.user.storage[PUSH_NOTIFICATION_ASKED]) {
      conv.ask(new Suggestions(PUSH_NOTIFICATION_SUGGESTION));
      conv.user.storage[PUSH_NOTIFICATION_ASKED] = true;
    }
  });
}

/**
 * Sends a system request to the user requesting permission to send
 * notifications.
 * @param {Conversation} conv
 */
function askPermissionToNotify(conv) {
  // NOTE: User notification must be first enabled in the Actions Console.
  // Actions -> <Action> -> User updates and notifications.
  conv.ask(new UpdatePermission({intent: 'tell.latest.tip'}));
}

/**
 * @param {Conversation} conv
 * @param {*} params
 * @return {Promise}
 */
function handlePermissionResponse(conv, params) {
  console.log('intent.PERMISSION - register for update');
  if (conv.arguments.get('PERMISSION')) {
    const userId = conv.arguments.get('UPDATES_USER_ID');
    return registerUserForUpdate(userId, 'tell.latest.tip')
      .then((docRef) => {
        conv.close(`Ok, I'll start alerting you.`);
      });
  } else {
    conv.close(`Ok, I won't alert you.`);
  }
}

/**
 * @param {Conversation} conv
 * @return {Promise}
 */
function askCategoryForDailyUpdates(conv) {
  conv.data[ASK_CATEGORY_FLAG] = true;
  return renderCategories(conv);
}

/**
 * Registers the user for update once user selects a category.
 * @param {Conversation} conv
 * @param {string} category
 */
function registerForDailyUpdates(conv, category) {
  console.log('configure Updates - ' + category);
  // NOTE: To enable updates for an intent, it must be enabled in the
  // Actions console. Actions -> Intent -> User updates and notifications.
  conv.ask(new RegisterUpdate({
    intent: 'tell.tip',
    arguments: [{name: Parameters.CATEGORY, textValue: category}],
    frequency: 'DAILY',
  }));
}

/**
 * @param {Conversation} conv
 * @param {*} params
 * @param {*} registered
 */
function handleUpdateResponse(conv, params, registered) {
  console.log('intent.REGISTER_UPDATE ', params, registered);
  if (registered && registered.status === 'OK') {
    conv.close(`Ok, I'll start giving you daily updates.`);
  } else {
    conv.close(`Ok, I won't give you daily updates.`);
  }
}

/**
 * @param {Conversation} conv
 * @param {*} userInput
 * @return {Promise}
 */
function handleRawInput(conv, userInput) {
  console.log('user input: ' + userInput);
  if (conv.data[ASK_CATEGORY_FLAG]) {
    conv.data[ASK_CATEGORY_FLAG] = false;
    return registerForDailyUpdates(conv, userInput);
  } else if (userInput.includes(RECENT_TIP)) {
    return tellLatestTip(conv);
  } else if (userInput.includes(RANDOM_CATEGORY)) {
    return tellRandomTip(conv);
  } else if (userInput.includes(CATEGORIES)) {
    return renderCategories(conv);
  } else if (userInput.includes(DAILY_NOTIFICATION_SUGGESTION)) {
    return askCategoryForDailyUpdates(conv);
  } else if (userInput.includes(PUSH_NOTIFICATION_SUGGESTION)) {
    askPermissionToNotify(conv);
  } else {
    return getCategories()
      .then((categories) => {
        console.log('returning a random tip - ' + userInput);
        const match = categories.find((category) => {
          return userInput.includes(category);
        });
        if (match) {
          console.log('found a match for category - ' + match);
          return tellRandomTip(conv, match);
        } else {
          console.log('did not find a match, showing categories');
          return renderCategories(conv);
        }
      });
  }
}

/**
 * @param {Conversation} conv
 * @return {Promise}
 */
function handleMain(conv) {
  if (!hasScreenOutput(conv)) {
    return conv.ask(MSG_AUDIO_WELCOME);
  }
  conv.ask(MSG_WELCOME_MESSAGE);
  return renderCategories(conv);
}

/**
 * Action to tell a random tip.
 */
app.intent('tell.tip', (conv) => {
  return tellRandomTip(conv);
});

/**
 * Action to tell the latest tip.
 */
app.intent('tell.latest.tip', tellLatestTip);

/**
 * Action to setup push notification.
 */
app.intent('setup.push', askPermissionToNotify);

/**
 * Action that is invoked by the system to indicate that the user has
 * responded to the question regarding permission to send push
 * notifications.
 */
app.intent('actions.intent.PERMISSION', handlePermissionResponse);

/**
 * Action that is invoked by the system to inform the user of the result of
 * registering for updates.
 */
app.intent('actions.intent.REGISTER_UPDATE', handleUpdateResponse);

/**
 * Action to handle defaul welcome message.
 */
app.intent('actions.intent.MAIN', handleMain);

/**
 * Default action once user starts conversation. This action routes to a
 * more specific action based on the user input.
 */
app.intent('actions.intent.TEXT', handleRawInput);

exports.aogTips = functions.https.onRequest(app);
