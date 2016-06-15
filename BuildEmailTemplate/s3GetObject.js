var aws = require('aws-sdk');
var config = require('./config');

exports.getTemplate = function (event) {
  "use strict";
  var s3 = new aws.S3();
  if(event.hasOwnProperty('templateParams') && event.templateParams.hasOwnProperty('templateKey')) {
    return s3.getObject({
      Bucket: config.templateBucket,
      Key: event.templateParams.templateKey
    });
  } else {
    ///We assume you want to do something custom with S3 in this case.
    return s3.getObject(event);
  }

}
