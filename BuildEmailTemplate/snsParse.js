module.exports = function (response) {
  "use strict";
  var emailSenders = [];
  var smsSenders = [];
  console.log("snsParse response: ", response);
  var topicSubscribers = {};
  if(response.data.hasOwnProperty("Subscriptions")) {
    topicSubscribers = response.data.Subscriptions;
  } else {
    console.log("Unable to list the subscribers in your topic. Check permissions in IAM or verify the topic contains subscribers of email or sms type.");
  }
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
