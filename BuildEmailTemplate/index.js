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
              var listSubscriptionsByTopic = require("./listSubscriptionsByTopic");
              var getSNSSubscribers = listSubscriptionsByTopic(snsMessage, context);
              getSNSSubscribers.on('complete', function (snsResponse) {
                var snsParse = require('./snsParse');
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
            var engine = require('./engine');
            engine(snsMessage, context);
          }
          break;
        case "aws:sqs":
          if (config.hasOwnProperty('sqs') && config.sqs.hasOwnProperty('queueUrl')) {
            var sqsGetMessages = require('./sqsGetMessages');
            sqsGetMessages.on('complete', function (response) {
              console.log(response);
            })
            sqsGetMessages.send();
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
    var engine = require('./engine');
    engine(defaults, context);
  }
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
