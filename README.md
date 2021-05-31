# AWS Automated Email Engine

## What is it?

Do you need:
- A simple way to send emails from your frontend app
- Text and HTML email templates that live in S3
- A decoupled approach to handling email sending in your backend using a queue
- A way to find and retry failed emails

## What does it do?

This package deploys everything you need to trigger an email being sent via an API Gateway request. The payload could include your template variables, such as name, email, message, etc.

When the API gets a request, it calls a lambda that fetches the required template from S3 and compiles it to text or html. It then sends the compiled version along in a notification to SNS. A queue in SQS holds the message, where another lambda waits to handle sending to SES.


## Installation

```
npm install (this is for build tools)
cd BuildEmailTemplate
npm install (this is the lambda)
```

## Configuring AWS Components

### S3

Create a bucket and make a folder in it called `Templates`. This is where you put HTML/Text templates.


### SNS

Create a new topic. Note the `ARN` for the new topic.


### SQS (Optional/Experimental)

Create an queue. You'll want SNS to subscribe to this Queue. Then use another SNS topic to publish to the queue.

### SES

Configure SES like you normally would.


### Lambda

Open `lambda-config.js` and configure to your liking based on the options aws-sdk provides for lambdas.

### IAM

Open `sample-iam-policy.json` and copy into a managed policy. Create a new role and attach the policy. 

Click 'Trust Relationships' and edit the trust policy. Open `sample-iam-trust-policy.json` and copy into a managed policy.

## Deploying

`gulp deploy` reads `lambda-config.js`, creates a zip, and deploys it to AWS Lambda.


## Tests

`node test.js` has basic integration test coverage.


## Roadmap

* Improve SQS integration
* Support more SNS subscriber types and templates
* Provide CloudFormation template that makes the configuration much easier
* One-click deploy script
