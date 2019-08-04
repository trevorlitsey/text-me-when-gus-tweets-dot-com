const twilio = require('twilio');

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

module.exports = message => {
  return twilioClient.messages
    .create({
      body: message,
      from: '+12055831994',
      to: '+12052380264',
    })
    .catch(err => console.error(err))
    .then(message => console.log('text sent' + message.sid));
};
