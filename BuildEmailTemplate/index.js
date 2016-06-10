/**
 * Created by toadkicker on 6/9/16.
 */
var aws = require('aws-sdk');
var s3 = new aws.S3();
var sns = new aws.SNS();
var sqs = new aws.SQS();
var config = require('./config.js') || {};

exports.handler = function (event, context) {
  var templateParams = "";
  process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT'];
  //Check event source is SNS
  if (event.hasOwnProperty('Records')) {
    if(event.Records.length > 50) {
      console.log("SES max limit is 50 per request. This request is canceled.");
      return;
    }
    for (var i = event.Records.length - 1; i >= 0; i--) {
      switch(event.Records[i].EventSource) {
        case "aws:sns":
          snsMessage = JSON.parse(event.Records[i].Sns.Message);
          snsMessage.compiledTemplate = buildTemplate(snsMessage.templateParams, context);
          context.succeed(snsPublish(snsMessage));
          break;
        case "aws:sqs":
          if(config.hasOwnProperty('sqs') && config.sqs.hasOwnProperty('queueUrl')){
            context.succeed(sqsGetMessages());
          } else {
            console.log("Please set sqs.queueUrl to use this feature.")
          }
          break;
        default:
          context.fail("Invalid event source used. Please use SNS or SQS to invoke this function.");
      }
    }
  } else {
    config.templateParams = {};
    config.templateParams.subject = "Intensity";
    buildTemplate(event, context);
  }
}

function snsPublish (msg) {
  var params = {
    Message: msg.compiledTemplate, /* required */
    MessageAttributes: {
      msg: {
        DataType: 'String ' /* required */
      },
    },
    MessageStructure: 'email',
    Subject: msg.subject,
    TopicArn: msg.recipient
  };
  sns.publish(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
  });
}

function sqsGetMessages () {
  var params = {
    QueueUrl: config.sqs.queueUrl, /* required */
    MaxNumberOfMessages: 10,
    MessageAttributeNames: [
      'All'
    ],
    VisibilityTimeout: 0,
    WaitTimeSeconds: 0
  };
  sqs.receiveMessage(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
  });
}

function buildTemplate(event, context) {
  "use strict";
  s3.getObject({
      Bucket: config.templateBucket,
      Key: config.templateKey
    },
    function (err, data) {
      if (err) {
        // Error
        console.log(err, err.stack);
        context.fail('Internal Error: Failed to load template from s3.')
      } else {
        var templateBody = data.Body.toString();
        console.log("Template Body: " + templateBody);

        // Perform the substitutions
        var mark = require('markup-js');

        var subject = mark.up(config.templateParams.subject, event);
        console.log("Final subject: " + subject);

        var message = mark.up(templateBody, event);
        console.log("Final message: " + message);
        return message;
      }
    })
}
