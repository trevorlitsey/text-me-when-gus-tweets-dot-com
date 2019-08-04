const Twitter = require('twitter');

const twitterClient = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

module.exports = async () => {
  const params = { user_id: '2431412198' };

  return new Promise((res, rej) => {
    twitterClient.get('statuses/user_timeline', params, function(
      error,
      tweets,
      response
    ) {
      if (!error) {
        const pureTweets = tweets.filter(tweet => !tweet.in_reply_to_user_id);

        if (pureTweets.length) {
          return res(pureTweets);
        }
      } else {
        return rej(error);
      }
    });
  });
};
