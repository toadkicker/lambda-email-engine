/**
 * Created by toadkicker on 6/9/16.
 */
var aws = require('aws-sdk');
var config = require('./config.js') || {};
var _ = require('underscore');
var email = require('./email');

exports.handler = function (event, context) {
  var defaults = _.extend(event, config);

  process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT'];
  //Check event source is SNS
  if (event.hasOwnProperty('Records')) {

    for (var i = event.Records.length - 1; i >= 0; i--) {
      switch (defaults.Records[i].EventSource) {
        case "aws:sns":
          snsMessage = _.extend(config, JSON.parse(event.Records[i].Sns.Message));
          //we want to publish to another topic
          if (snsMessage.recipient.match(/^arn/)) {
            var s3Templates = require('./s3GetObject');
            var template = require('./template');
            var s3request = s3Templates.getTemplate(snsMessage);
            s3request.on('error', function (err) {
              context.fail(err);
            });
            s3request.on('complete', function (response) {
              snsMessage.compiledTemplate = template.compile(snsMessage, response.data.Body.toString(), context);
              var getSNSSubscribers = listSubscriptionsByTopic(snsMessage, context);
              getSNSSubscribers.on('complete', function (snsResponse) {
                var snsSubscribers = snsParse(snsResponse);
                snsSubscribers.email.forEach(function (emailer) {
                  snsMessage.recipient = emailer.Endpoint;
                  email.send(snsMessage, context);
                })
                snsSubscribers.sms.forEach(function (smser) {
                  snsMessage.recipient = smser.Endpoint;
                  email.send(snsMessage, context);
                })
              });
              getSNSSubscribers.send()
            });
            s3request.send()
          }
          //we want to publish to SES
          if (snsMessage.recipient.match(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) {
            sendSesEmail(snsMessage, context);
          }
          break;
        case "aws:sqs":
          if (config.hasOwnProperty('sqs') && config.sqs.hasOwnProperty('queueUrl')) {
            context.succeed(sqsGetMessages(defaults, context));
          } else {
            context.fail("Please set sqs.queueUrl to use this feature.");
          }
          break;
        default:
          context.fail("Invalid event source used. Please use a valid email address, SNS ARN topic, or SQS queueUrl to invoke this function.");
      }
    }
  } else {
    var s3Templates = require('./s3GetObject');
    var compileTemplate = require('./template');

    s3Templates.getTemplate(defaults, context).on('success', function () {
      "use strict";
      defaults.compiledTemplate = compileTemplate.compile(defaults, context);
      email.send(defaults, context);
    })
  }
}

function listSubscriptionsByTopic (msg) {
  var sns = new aws.SNS();
  return sns.listSubscriptionsByTopic({TopicArn: msg.recipient})
};

function snsParse (response) {
  "use strict";
  var emailSenders = [];
  var smsSenders = [];
  var topicSubscribers = response.data.Subscriptions;
  for (var i = topicSubscribers.length - 1; i >= 0; i--) {
    switch (topicSubscribers[i].Protocol) {
      case "email":
        emailSenders.push(topicSubscribers[i])
        break;
      case "sms":
        smsSenders.push(topicSubscribers[i]);
        break;
      default:
        snsPublish(msg, context);
    }
  }
  return {
    email: emailSenders,
    sms: smsSenders
  }
}

function snsPublish (msg, context) {
  var sns = new aws.SNS();

  var params = {
    Message: msg.compiledTemplate, /* required */
    MessageAttributes: {
      msg: {
        StringValue: msg.compiledTemplate,
        DataType: 'String' /* required */
      },
    },
    MessageStructure: 'email',
    Subject: msg.subject,
    TopicArn: msg.recipient
  };
  sns.publish(params, function (err, data) {
    if (err) context.fail(err, err.stack); // an error occurred
    else     context.succeed(data);           // successful response
  });
}

function sqsGetMessages (event, context) {
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
  sqs.receiveMessage(params, function (err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     buildTemplate(event, context);           // successful response
  });
}

function buildTemplate (event, context) {
  "use strict";
  var s3 = new aws.S3();
  if (!event.hasOwnProperty('templateParams') && !event.templateParams.hasOwnProperty('templateKey')) {
    context.fail('No templateParams.templateKey defined')
  }

  return s3.getObject({
    Bucket: config.templateBucket,
    Key: event.templateParams.templateKey
  }).on('success',
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

        var subject = mark.up(event.templateParams.subject, event);
        console.log("Final subject: " + subject);

        var message = mark.up(templateBody, event);
        console.log("Final message: " + message);
        return message;
      }
    })
}
