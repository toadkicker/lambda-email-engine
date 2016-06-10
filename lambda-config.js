module.exports = {
  //accessKeyId: <access key id>,  // optional
  //secretAccessKey: <secret access key>,  // optional
  // profile: <shared credentials profile name>, // optional for loading AWS credentials from custom profile
  region: 'us-east-1',
  handler: 'index.handler',
  role: 'arn:aws:iam::412642013128:role/aws-lambda-send-ses-email',
  functionName: 'build-email-template',
  timeout: 10,
  memorySize: 128
}
