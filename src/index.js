const fs = require('fs');
const http = require('http');
const express = require('express');
const getTweets = require('./get-tweets');
const sendTextMessage = require('./send-text-message');

const SENT_TWEETS_FILE = 'sent-tweets.json';

const app = express();

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

  const newTweets = recentTweets.reverse().filter(recentTweet => {
    if (sentTweetIds.includes(recentTweet.id)) {
      return false;
    }

    return true;
  });

  if (newTweets.length) {
    newTweets.forEach(newTweet => {
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
      JSON.stringify(sentTweets.concat(justSentTweets), null, '\t')
    );
  } else {
    const resp = { message: 'no new tweets found' };
    console.log(resp);
    res.json(resp);
  }
});

const PORT = 3000 || process.env.PORT;
http.createServer(app).listen(PORT, () => {
  console.log('> app listening on http://localhost:' + PORT);
});
