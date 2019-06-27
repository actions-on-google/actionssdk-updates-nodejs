# Actions on Google: Daily Updates & Push Notifications Sample

This sample demonstrates Actions on Google user engagement features including daily updates and push notifications -- using [Actions SDK](https://developers.google.com/actions/sdk/) in [Node.js](https://github.com/actions-on-google/actions-on-google-nodejs) and deployed on [Cloud Functions for Firebase](https://firebase.google.com/docs/functions/).

After hearing a tip about developing Actions for the Google Assistant, users can subscribe to receive additional tips through notifications. There are two subscription options are available:
* If a category is selected, you are given the option to receive daily notifications at a fixed time; the notification deeplinks into receiving a tip from a category in a conversation.
* If the latest tip is selected, you are given the option to subscribe to notifications when a new tip is added; the notification deeplinks into receiving the newest tip in a conversation.

## Setup Instructions
### Prerequisites
1. Node.js and NPM
    + We recommend installing using [NVM](https://github.com/creationix/nvm)
1. Install the [Firebase Functions CLI](https://firebase.google.com/docs/functions/get-started#set_up_and_initialize_functions_sdk)
    + We recommend using version 6.5.0, `npm install -g firebase-tools@6.5.0`
    + Run `firebase login` with your Google account
1. [Install the gactions CLI](https://developers.google.com/actions/tools/gactions-cli)
    + You may need to grant execute permission, ‘chmod +x ./gactions’

### Configuration
#### Actions Console
1. From the [Actions on Google Console](https://console.actions.google.com/), New project (this will become your *Project ID*) > **Create project** > under **More options** select **Actions SDK** > keep the **Use Actions SDK to add Actions** window open, will revisit in a later step.

#### Cloud Platform Console
1. From the [Cloud Platform console](https://console.cloud.google.com/), find and select your Actions on Google **Project ID**
1. From **Menu ☰** > **APIs & Services** > **Library** > select **Actions API** > **Enable**
1. Back under **Menu ☰** > **APIs & Services** > **Credentials** > **Create Credentials** > **Service Account Key**.
1. From the dropdown, select **New Service Account**
    + name:  `service-account`
    + role:  **Project/Owner**
    + key type: **JSON** > **Create**
    + Your private JSON file will be downloaded to your local machine; save private key in `functions/` and rename to `service-account.json`

#### Firestore Database
1. From the [Firebase console](https://console.firebase.google.com), find and select your Actions on Google **Project ID**
1. In the left navigation menu under **Develop** section > **Database** > **Create database** button > Select **Start in test mode** > **Enable**

#### Firebase Deployment
1. On your local machine, in the `functions` directory, run `npm install`
1. Run `firebase deploy --project {PROJECT_ID}`, replace {PROJECT_ID} to deploy the function
1. Update the action package, `action.json`, replacing the placeholder value with `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/aogTips`, obtained from the previous step.
```
 Function URL (aogTips): https://${REGION}-${PROJECT_ID}.cloudfunctions.net/aogTips
```
1. From the top level directory in this sample, run `gactions update --action_package action.json --project {PROJECT_ID}` with your *Project ID*.
1. In order to add the tips to the Firestore DB, in your browser, visit the following Function URL:
```
https://${REGION}-${PROJECT_ID}.cloudfunctions.net/restoreTipsDB
```
#### Configure Daily Updates and Notifications
1. Back in the [Actions console](https://console.actions.google.com), from the pop up window > select **OK**.
1. From the [Actions on Google console](https://console.actions.google.com) > under **Build** > **Actions**
1. To setup Daily Updates:
    + Select the `Tell a tip` intent > under **User engagement** > **Enable** `Would you like to offer daily updates to users?` > add a title `Advice Alert` > **Save**
    + Select the `Tell the latest tip` intent > under **User engagement** > **Enable** `Would you like to send push notifications? If yes, user permission will be needed` > add a title `Latest Tip Alert` > **Save**
1. From the top menu click **Test** to open the Actions on Google simulator then say or type `Talk to my test app`.
1. To test daily updates, choose a category. Below the tip, the app will show a suggestion chip to subscribe for daily updates.
1. To test push notifications, choose to hear the latest tip. Below the tip, the app will show
a suggestion chip to subscribe for push notifications.
1. Then add a new tip to the Firestore Database to trigger a notification to the subscribed users. In the tips collection > select **Add document**:
    + Document ID: select **Auto ID**
    + field: `category`, type: string, value: `tools`
    + field: `created_at`, type: string, value: `2019-05-30T011:00:00.000Z` and modify value to current time
    + field: `tip`, type: string, value: `Here's the most recent info about tools`
    + field: `url`, type: string, value: `https://developers.google.com/actions/assistant/updates/notifications`

### Running this Sample
+ You can test your Action on any Google Assistant-enabled device on which the Assistant is signed into the same account used to create this project. Just say or type, “OK Google, talk to my test app”.
+ You can also use the Actions on Google Console simulator to test most features and preview on-device behavior.

## References & Issues
+ Questions? Go to [StackOverflow](https://stackoverflow.com/questions/tagged/actions-on-google), [Assistant Developer Community on Reddit](https://www.reddit.com/r/GoogleAssistantDev/) or [Support](https://developers.google.com/actions/support/).
+ For bugs, please report an issue on Github.
+ Getting started with [Actions SDK Guide](https://developers.google.com/actions/sdk/).
+ Actions on Google [Documentation](https://developers.google.com/actions/extending-the-assistant)
+ Actions on Google [Codelabs](https://codelabs.developers.google.com/?cat=Assistant).

## Make Contributions
Please read and follow the steps in the [CONTRIBUTING.md](CONTRIBUTING.md).

## License
See [LICENSE](LICENSE).

## Terms
Your use of this sample is subject to, and by using or downloading the sample files you agree to comply with, the [Google APIs Terms of Service](https://developers.google.com/terms/).
