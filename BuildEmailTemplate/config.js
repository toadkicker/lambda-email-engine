"use strict";

var config = {
  "templateBucket" : "com.intensity.forecasts.emails",
  "templateParams": {
    "templateKey" : "Templates/template.html",
    "targetAddress" : "todd.baur@intensity.com",
    "replyToAddress": "noreply@support.intensity.com",
    "fromName": "Forecasts by Intensity",
    "fromAddress": "noreply@support.intensity.com",
    "subject" : "Intensity",
  }
}

module.exports = config
