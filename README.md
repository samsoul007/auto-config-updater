

Things on internet move fast. New versions are being deployed all the time and it is hard to keep track of them. If you have hundreds of services running and some of them requires a specific version of an API you have to either put it in a config file, or in the process ENV.

This is not optimal when new versions of your API provider are available weekly or monthly (ex: Facebook Marketing API) and that they retire the old version shortly after. How do you reliably change those versions without redeploying everything.

Well with this module you can now "listen" to changes in a remote file and act accordingly. No need to redeploy anything, just make sure to update your code to handle the changes. It can be in auth keys or versions or whatever you see fit.

# installation

`npm install --save auto-config-updater`

# usage

## before you start

This module only currently supports JSON data. Upon being received the JSON object will be flattened:

```javascript
//If you have this file
{
  "test": 123,
  "val": {
    "a": "value"
  }
}

//It will be converted to
{
  "test":123,
  "val.a": "value"
}

```

When you setup the handler you need to do it on the flat key (ex: if you want to get the `a` value when you need to enter `val.a`)


## setting up a configuration

This module allows multiple variable files to be loaded.
Right now it only supports from Amazon S3.

```javascript
const CU = require("auto-config-updater")
const AWS = require("aws-sdk");
//setup your AWS SDK
AWS.config.update({...});

/**
 * @param {object}  oS3 AWS s3 object (new AWS.S3()).
 * @param {string}  bucket Name of S3 bucket.
 * @param {string}  key path to file in S3 bucket.
 * @param {integer} [refresh=60000] refresh time to look in ms.
 * @param {string}  [config='default'] name of the config
 */
CU.config.fromS3(oS3, bucket, key, refresh, config)

CU.config.fromS3(new AWS.S3(), "mybucket", "mykey", 5000, "my-versions")


```

## Value change handler

When a value has changed this handler will be triggered. You can add as many handlers as you want on each key

```javascript
const CU = require("auto-config-updater")

/**
 * @param {string}    key Key to check on the value of the file.
 * @param {function}  handler Callback function for the handler.
 * @param {string}    [config='default'] name of the config
 */
CU.handler.onChange("key",handler, config)

CU.handler.onChange("version",(value, key) => {
  console.log("the value has changed:", value, key)
},"my-versions")
```
