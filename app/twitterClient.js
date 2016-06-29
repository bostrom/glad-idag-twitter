'use strict';

var Twitter = require('twitter'),
  config = require('../config/config');

var twitterClient = new Twitter({
  consumer_key: config.creds.twitter_consumer_key,
  consumer_secret: config.creds.twitter_consumer_secret,
  access_token_key: config.creds.twitter_access_token_key,
  access_token_secret: config.creds.twitter_access_token_secret
});

function postTweet(content, cb) {
  twitterClient.post('statuses/update', {
    status: content
  }, cb);
}

function postMediaTweet(content, mediaId, cb) {
  twitterClient.post('statuses/update', {
    status: content,
    media_ids: mediaId
  }, cb);
}

function postImage(base64Data, cb) {
  twitterClient.post('media/upload', {
    media_data: base64Data
  }, cb);
}

module.exports = {
  tweet: postTweet,
  mediaTweet: postMediaTweet,
  image: postImage
};
