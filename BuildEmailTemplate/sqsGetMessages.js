var s3Templates = require('./s3Templates');
var email = require('./email');
module.exports = function (config) {
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
  return sqs.receiveMessage(params, function (err, data) {
    if (err) {
      console.log(err, err.stack);
    }// an error occurred
    else {
      var s3request = s3Templates.getTemplate(data);
      s3request.on('error', function (err) {
        context.fail(err);
      });
      s3request.on('complete', function (response) {
        data.compiledTemplate = template.compile(data, response.data.Body.toString(), context);
        email.send(data, context);
      })      
      s3request.send();
    }       // successful response
  });
}
