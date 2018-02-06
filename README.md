# Actions on Google: Updates API sample using Node.js and Cloud Functions for Firebase

This sample shows an app that gives tips about developing apps for the Google Assistant
using Actions on Google. After hearing a tip, users can subscribe to receive additional tips through notifications. Two subscription models are available:
* if the user chooses to hear a tip from a selected category, the app proposes to subscribe to receive daily notifications at a fixed time; the notification deeplinks into receiving a tip from a category in a conversation.
* If the user chooses to hear the latest tip, the app proposes to subscribe to receive notifications when a new tip is added; the notifiaction deeplinks into receiving the newest tip in a conversation.

## Setup Instructions

### Steps
1. Use the [Actions on Google Console](https://console.actions.google.com) to add a new project with a name of your choosing.
1. Choose *Actions SDK* in the *Add actions to your app* section. A dialog pops up: leave it open because you will need it for an upcoming step.
1. Go to the [Firebase console](https://console.firebase.google.com) and select the project that you have created on the Actions on Google console.
1. Click the gear icon, then select *Project settings* > *SERVICE ACCOUNTS*.
1. Generate a new private key and save it in the `functions` folder calling the file `service-account.json`.
1. Deploy the fulfillment webhook provided in the `functions` folder using [Google Cloud Functions for Firebase]
(https://firebase.google.com/docs/functions/):
  1. Follow the instructions to [set up and initialize Firebase SDK for Cloud Functions](https://firebase.google.com/docs/functions/get-started#set_up_and_initialize_functions_sdk). Make sure to select the project that you have previously generated in the Actions on Google Console and to reply "N" when asked to overwrite existing files by the Firebase CLI.
  1. Run `firebase deploy --only functions` and take note of the endpoint where the fulfillment webhook has been published. It should look like `Function URL (aogTips): https://us-central1-YOUR_PROJECT.cloudfunctions.net/aogTips`.
1. Update the action package, `aogtips.json`, replacing the placeholder value `YOUR_ENDPOINT_URL` with the value for Function URL obtained from the previous step.
1. [Install the gactions CLI](https://developers.google.com/actions/tools/gactions-cli) if you haven't already.
1. Go back to the Actions console, copy the command shown in the Actions console, replace `PACKAGE_NAME` with "aogtips.json" and execute it in a shell. The final command should look like `gactions update --action_package aogtips.json --project <YOUR_PROJECT_ID>`
1. Click *OK* in the Actions console to dismiss the *Use Actions SDK to add actions to your Assistant app* dialog.
1. Go to the [Firebase console](https://console.firebase.google.com) and select the project that you have created on the Actions on Google console.
1. In the *Database* section, click *Try Firestore Beta*.
1. Click *Enable*. While testing this sample, you can keep the database world readable.
1. To add tips to the newly created Firestore database, load in a browser `https://${REGION}-${PROJECT}.cloudfunctions.net/restoreTipsDB`.
1. Go back to the [Actions on Google console](https://console.firebase.google.com) and select the project that you have created for this sample.
1. Type `Talk to my test app` in the simulator, or say `OK Google, talk to my test app` to any Actions on Google enabled device signed into your developer account.
1. To test daily updates, choose a category. After the tip, the app will show a suggestion chip to subscribe for daily updates.
1. To test push notifications, choose to hear the latest tip. After the tip, the app will show
a suggestion chip to subscribe for push notifications. Add a new tip to the Firestore DB to trigger a notification to the subscribed users.

For more detailed information on deployment, see the [documentation](https://developers.google.com/actions/sdk/).

## References and How to report bugs
* Actions on Google documentation: [https://developers.google.com/actions/](https://developers.google.com/actions/).
* If you find any issues, please open a bug here on GitHub.
* Questions are answered on [StackOverflow](https://stackoverflow.com/questions/tagged/actions-on-google).

## How to make contributions?
Please read and follow the steps in the CONTRIBUTING.md.

## License
See LICENSE.md.

## Terms
Your use of this sample is subject to, and by using or downloading the sample files you agree to comply with, the [Google APIs Terms of Service](https://developers.google.com/terms/).

## Google+
Actions on Google Developers Community on Google+ [https://g.co/actionsdev](https://g.co/actionsdev).

