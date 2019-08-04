const fs = require('fs');
const http = require('http');
const express = require('express');
const getTweets = require('./get-tweets');
const sendTextMessage = require('./send-text-message');

const SENT_TWEETS_FILE = 'sent-tweets.json';

const app = express();

app.get('/', (_req, res) => {
  res.status(200).send('all good');
});

app.post('/check-tweets', async (_req, res) => {
  let recentTweets = [];

  try {
    recentTweets = await getTweets();
  } catch (e) {
    console.error(e);
  }

  let sentTweets = [];

  if (fs.existsSync('sent-tweets.json')) {
    sentTweets = JSON.parse(fs.readFileSync(SENT_TWEETS_FILE));
  }

  const sentTweetIds = sentTweets.map(sentTweet => sentTweet.id);

  const newTweets = recentTweets.filter(recentTweet => {
    if (sentTweetIds.includes(recentTweet.id)) {
      return false;
    }

    return true;
  });

  if (newTweets.length) {
    [...newTweets].reverse().forEach(newTweet => {
      sendTextMessage(newTweet.text);
    });

    const justSentTweets = newTweets.map(({ id, text, created_at }) => ({
      id,
      text,
      created_at,
    }));

    const stringifiedTweetIds = JSON.stringify(justSentTweets, null, '\t');
    const resp = { message: 'new tweets sent: ' + stringifiedTweetIds };
    console.log(resp);
    res.json(resp);

    fs.writeFileSync(
      SENT_TWEETS_FILE,
      JSON.stringify(justSentTweets.concat(sentTweets), null, '\t')
    );
  } else {
    const resp = { message: 'no new tweets found' };
    console.log(resp);
    res.json(resp);
  }
});

app.get('/sent-tweets', (_req, res) => {
  let sentTweets = [];

  if (fs.existsSync('sent-tweets.json')) {
    sentTweets = JSON.parse(fs.readFileSync(SENT_TWEETS_FILE)).reverse();
  }

  res.json({ sentTweets });
});

const PORT = process.env.PORT || 3000;
http.createServer(app).listen(PORT, () => {
  console.log('> app listening on http://localhost:' + PORT);
});
