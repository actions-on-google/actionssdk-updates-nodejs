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

const {aogTips} = require('./aog-webhook');
const {
  tellLatestTip,
  tellRandomTip,
  getCategories,
  restoreTipsDB,
  getUsersRegisteredForNotification,
  authorizeAndSendNotification,
  registerToSendNotification,
} = require('./http-webhook');

// NOTE: Only aogTips is required for Actions on Google. The rest are HTTP
// functions that make it easier to debug specific parts of the app.
module.exports = {
  aogTips,
  tellLatestTip,
  tellRandomTip,
  getCategories,
  restoreTipsDB,
  getUsersRegisteredForNotification,
  authorizeAndSendNotification,
  registerToSendNotification,
};
