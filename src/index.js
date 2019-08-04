const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const getTweets = require('./get-tweets');
const { createMongooseConnection } = require('./connections');
const { User, Tweet } = require('./models');
const sendTextMessage = require('./send-text-message');

const app = express();

app.use(bodyParser.json());

app.use(cors());

app.get('/', (_req, res) => {
  res.status(200).send('all good');
});

app.post('/user/create', async (req, res) => {
  try {
    if (req.body && req.body.phoneNumber) {
      if (!/^\d{10}$/.test(req.body.phoneNumber)) {
        throw new Error('Please enter a valid 10 digit phone number');
      }
    }
    const user = new User(req.body);
    await user.save();
    res.status(200).json(user);
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

app.post('user/delete', async (req, res) => {
  const { phoneNumber } = req.body;
  try {
    const user = await User.deleteOne({ phoneNumber });
    res.status(200).send(user);
  } catch (e) {
    return res.status(400).send({ message: e.message });
  }
});

app.use('/twilio', bodyParser.urlencoded({ extended: false }));

app.post('/twilio', async (req, res) => {
  const twiml = new MessagingResponse();
  console.log(req.body);

  const phoneNumber = req.body.From;
  const body = req.body.Body ? req.body.Body.toUpperCase() : '';

  try {
    if (body.includes('START')) {
      const user = new User({ phoneNumber });
      await user.save();
      twiml.message(
        `Welcome. You are now subscribed to text messages alerts for Gus's tweets. Never miss a good one. Text STOP at any time to unsubscribe.`
      );
    } else if (body.includes('STOP')) {
      await User.deleteOne({ phoneNumber });
      twiml.message('Thanks for the text. You are now unsubscribed.');
    } else {
      const currentUser = await User.find({ phoneNumber });
      // if they're already subscribed.
      if (currentUser) {
        twiml.message(
          `Sorry, I don't understand what you'd like to do. If you'd like to unsubscribe, text STOP at any time.`
        );
      } else {
        // if they're not already subscribed.
        twiml.message(
          `Sorry, I don't understand what you'd like to do. If you'd like to subscribe, text START at any time.`
        );
      }
    }
  } catch (e) {
    console.error(e);
    twiml.message('Sorry, an error occurred. Please try again.');
  }

  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
});

app.get('/users/total', async (_req, res) => {
  const totalUsers = await User.find().countDocuments();
  res.status(200).send({ totalUsers });
});

app.post('/check-tweets', async (_req, res) => {
  let recentTweets = [];

  try {
    recentTweets = await getTweets();
  } catch (e) {
    console.error(e);
  }

  const sentTweets = await Tweet.find();

  const sentTweetIds = sentTweets.map(sentTweet => sentTweet.id);

  const newTweets = recentTweets.filter(recentTweet => {
    if (sentTweetIds.includes(recentTweet.id + '')) {
      return false;
    }

    return true;
  });

  const users = await User.find();

  if (newTweets.length) {
    [...newTweets].reverse().forEach(newTweet => {
      users.forEach(user => {
        sendTextMessage(newTweet.text, user.phoneNumber);
      });
    });

    const justSentTweets = newTweets.map(({ id, text, created_at }) => ({
      id,
      text,
      created_at,
    }));

    await Promise.all(
      justSentTweets.map(justSentTweet => {
        const newTweet = new Tweet(justSentTweet);
        return newTweet.save();
      })
    );

    const stringifiedTweetIds = JSON.stringify(justSentTweets, null, '\t');
    const resp = { message: 'new tweets sent: ' + stringifiedTweetIds };
    console.log(resp);
    res.json(resp);
  } else {
    const resp = { message: 'no new tweets found' };
    console.log(resp);
    res.json(resp);
  }
});

app.get('/sent-tweets', async (_req, res) => {
  const sentTweets = await Tweet.find();

  res.json({ sentTweets });
});

app.post('/clear-tweets', async (_req, res) => {
  await Tweet.deleteMany();
  const resp = { messgae: 'recent tweets cleared' };
  console.log(resp);
  res.json(resp);
});

const PORT = process.env.PORT || 3000;
createMongooseConnection().then(() => {
  http.createServer(app).listen(PORT, () => {
    console.log('> app listening on http://localhost:' + PORT);
  });
});
