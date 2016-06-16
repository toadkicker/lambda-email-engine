# Build Email Template

## Purpose

Given the proper event data, compiles an email template in an S3 bucket and sends it off.
Subscribes to an SNS topic for the creation of making a text or html formatted email template.
It can also forward to an SNS topic containing a list of email or SMS endpoints.
Can be used with SQS to enable batch mode processing.
It can also process a single email recipient and send an email.

## Configuration

This lambda utilizes this policy to work: https://console.aws.amazon.com/iam/home?region=us-east-1#policies/arn:aws:iam::412642013128:policy/aws-lambda-send-ses-email

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ec2:CreateNetworkInterface",
                "ec2:DescribeNetworkInterfaces",
                "ec2:DetachNetworkInterface",
                "ec2:DeleteNetworkInterface"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:*:*:*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "cloudwatch:PutMetricData"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "ses:SendEmail"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "sns:Publish",
                "sns:ListSubscriptionsByTopic"
            ],
            "Resource": [
                "arn:aws:sns:us-west-2:412642013128:build_email_template",
                "arn:aws:sns:us-east-1:412642013128:build-email-template",
                "arn:aws:sns:us-east-1:412642013128:build-email-template-dev",
                "arn:aws:sns:us-east-1:412642013128:marketing_notifications",
                "arn:aws:sns:us-east-1:412642013128:support_notifications"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject"
            ],
            "Resource": "arn:aws:s3:::com.intensity.forecasts.emails/Templates/*"
        }
    ]
}
```

## Usage

Take a look at the `_sample.json` files in the project for how this works with SNS, SQS, and SES. The basic SNS message envelope needs to be structured like so:

```
{
  "recipient": "arn:aws:sns" || "arn:aws:sqs" || "someone@somewhere.com",
  "subject": "AWS Internal value can be set to anything useful",
  "templateBucket": "my.templates.bucket"
  "templateParams": {
    "subject": "This shows up in email/SMS",
    "fromAddress": "a_valid@ses.configured.domain.com",
    "templateKey": "Templates/markup.html" || "Templates/markup.txt"
  }
}
```

Technically all values in the envelope are optional. `config.js` contains the default values which can all be overwritten when this function is invoked.

## Deployment

`lambda-config.js` contains the deployment parameters. It supports any `aws lambda` cli arguments.

`gulp deploy`

## Testing

`node test.js` runs integration tests using `_sample.json` files.

## Contributing

Pull requests are welcome! Please make sure to update tests as needed to support the changes.