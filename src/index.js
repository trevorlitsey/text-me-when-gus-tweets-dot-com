const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
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
