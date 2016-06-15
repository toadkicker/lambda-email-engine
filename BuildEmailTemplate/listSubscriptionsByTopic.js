/**
 * Created by toadkicker on 6/14/16.
 */
var aws = require("aws-sdk");
module.exports = function (msg) {
  var sns = new aws.SNS();
  return sns.listSubscriptionsByTopic({TopicArn: msg.recipient})
}
