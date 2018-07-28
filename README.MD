# Catapush PhoneGap / Cordova / Ionic Library
## Introduction
Demo implementation of the [Catapush](http://www.catapush.com) messaging on a Phonegap / Cordova application.

## Screenshots
<div style="text-align:center">
    <img src="http://cdn.catapush.com/hubfs/images/phonegap/1.jpg" alt="Screenshot 1" width="20%">
    &nbsp;
    <img src="http://cdn.catapush.com/hubfs/images/phonegap/2.jpg" alt="Screenshot 2" width="20%">
    &nbsp;
    <img src="http://cdn.catapush.com/hubfs/images/phonegap/3.jpg" alt="Screenshot 3" width="20%">
    &nbsp;
    <img src="http://cdn.catapush.com/hubfs/images/phonegap/4.jpg" alt="Screenshot 4" width="20%">
</div>

## Setup
Follow this steps to setup your first Cordova app (similar steps for a Ionic app). You should have [nodejs and npm installed](https://nodejs.org/en/download/).

1. Install cordova:
   ```bash
   npm install -g cordova
   ```

2. Setup a new project:
   ```bash
   cordova create catapush com.company.app DemoApp
   ```

3. Install required plugins:
   ```bash
   cd cordova
   cordova plugin add cordova-plugin-device
   cordova plugin add https://github.com/Catapush/phonegap-plugin-push.git --variable SENDER_ID="XXXXXXX" (in alternative to cordova plugin add phonegap-plugin-push)
   cordova plugin add cordova-plugin-x-toast
   cordova plugin add cordova-plugin-file
   cordova plugin add cordova-plugin-file-opener2
   ```

4. [Download the project](https://github.com/Catapush/phonegap-demo/archive/master.zip) and replace the www folder to use it as a boilerplate.

5. [Follow Cordova instructions](https://cordova.apache.org/docs/en/latest/guide/cli/index.html) to add platforms and build the project.

## Further notes
* To support ios 6, install following version of phonegap-plugin-push and cordova:
```bash
cordova platform add ios@3.9.2
cordova plugin add phonegap-plugin-push@1.5.3 --variable SENDER_ID="XXXXXXX"
```

* Official Phonegap Push Plugin currently has a bug with Android devices which prevents app restart when a push notification is received if the app has been closed manually. There is a pending [pull request](https://github.com/phonegap/phonegap-plugin-push/pull/1086) that can be used to patch the bug until it is merged or even better use the [Catapush phonegap-plugin-push repository](https://github.com/Catapush/phonegap-plugin-push). Please remember to change MainActivity.java as suggested in the documentation. 

* Follow these instructions to setup push notification in your Catapush App Dashboard
  * [Google GCM](http://www.catapush.com/docs-android)
  * [Apple APN](http://www.catapush.com/docs-ios)
  
* Try adding an old android platform if you have problems:
```bash
cordova platform add android@6.4.0
```