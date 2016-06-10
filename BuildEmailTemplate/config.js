"use strict";

var config = {
  "templateBucket" : "com.intensity.forecasts.emails",
  "templateKey" : "Templates/template.html",
  "targetAddress" : "todd.baur@intensity.com",
  "fromAddress": "Forecasts by Intensity <support@forecasts.intensity.com>",
  "defaultSubject" : "Email From {{name}}"
}

module.exports = config
