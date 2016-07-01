# Build Email Template

## Purpose

Subscribes to an SNS topic for the creation of making a text or html formatted email template. 
Can be used with SQS to enable batch mode processing.

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
