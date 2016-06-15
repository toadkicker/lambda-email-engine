module.exports = function (event, context) {
  "use strict";
  var s3Templates = require('./s3GetObject');
  var compileTemplate = require('./template');
  var s3request = s3Templates.getTemplate(event);
  var email = require('./email');
  s3request.on('error', function (err) {
    context.fail(err);
  });
  s3request.on('complete', function (response) {
    "use strict";
    event.compiledTemplate = compileTemplate.compile(event, response.data.Body.toString());
    var emailRequest = email.send(event, context);
    emailRequest.on('complete', function (response) {
      console.log('sent: ', response);
    });
    emailRequest.send();
  });
  s3request.send();
}
