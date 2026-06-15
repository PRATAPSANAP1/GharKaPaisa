const {
  SESClient,
  SendEmailCommand
} = require("@aws-sdk/client-ses");

const ses = new SESClient({
  region: process.env.AWS_REGION || "ap-south-1"
});

const sendEmail = async ({
  to,
  subject,
  html
}) => {
  const command = new SendEmailCommand({
    Source: process.env.MAIL_FROM,

    Destination: {
      ToAddresses: [to]
    },

    Message: {
      Subject: {
        Data: subject
      },

      Body: {
        Html: {
          Data: html
        }
      }
    }
  });

  return await ses.send(command);
};

module.exports = { sendEmail };
