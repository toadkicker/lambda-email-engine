/**
 * Created by toadkicker on 6/9/16.
 */
var aws = require('aws-sdk');
var config = require('./config.js') || {};

exports.handler = function (event, context) {

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
          //we want to publish to another topic
          if(snsMessage.recipient.match(/^arn/)) {
            context.succeed(snsPublish(snsMessage));
          }
          //we want to publish to SES
          if(snsMessage.recipient.match(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) {
            sendSesEmail(snsMessage, context);
          }
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
    config.templateParams = event;
    config.templateParams.subject = "Intensity";
    buildTemplate(event, context);
  }
}

function snsPublish (msg) {
  var sns = new aws.SNS();
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
  var sqs = new aws.SQS();
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
  var s3 = new aws.S3();

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

function sendSesEmail (event, context) {
  "use strict";
  var ses = new aws.SES();
  var params = {
    Destination: {
      ToAddresses: [
        event.recipient
      ]
    },
    Message: {
      Subject: {
        Data: event.subject,
        Charset: 'UTF-8'
      }
    },
    Source: event.fromAddress,
    ReplyToAddresses: [
      event.replyToAddress
    ]
  };

  var fileExtension = event.templateKey.split(".").pop();
  if (fileExtension.toLowerCase() == 'html') {
    params.Message.Body = {
      Html: {
        Data: event.message,
        Charset: 'UTF-8'
      }
    };
  } else if (fileExtension.toLowerCase() == 'txt') {
    params.Message.Body = {
      Text: {
        Data: event.message,
        Charset: 'UTF-8'
      }
    };
  } else {
    context.fail('Internal Error: Unrecognized template file extension: ' + fileExtension);
    return;
  }

  // Send the email
  ses.sendEmail(params, function (err, data) {
    if (err) {
      console.log(err, err.stack);
      context.fail('Internal Error: The email could not be sent.' + err);
    } else {
      console.log(data);           // successful response
      context.succeed('The email was successfully sent to ' + event.recipent);
    }
  });
}
