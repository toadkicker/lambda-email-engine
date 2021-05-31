"use strict";
const templateSettings = process.env.event;

export const config = {
  "templateBucket" : `${templateSettings.bucket}`,
  "templateParams": {
    "templateKey" : "Templates/template.html",
    "targetAddress" : `${templateSettings.targetAddress}`,
    "replyToAddress": `${templateSettings.replyToAddress}`,
    "fromName": `${templateSettings.fromName}`,
    "fromAddress": `${templateSettings.fromAddress}`,
    "subject" : `${templateSettings.subject}`,
  }
}
