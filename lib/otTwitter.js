'use strict';

var
  Promise = require('bluebird'),
  Twitter = require('twitter'),
  imageGenerator = require('./imageGenerator'),
  config = require('../config/config'),
  twitter = new Twitter({
    consumer_key: config.creds.twitter_consumer_key,
    consumer_secret: config.creds.twitter_consumer_secret,
    access_token_key: config.creds.twitter_access_token_key,
    access_token_secret: config.creds.twitter_access_token_secret
  });

Promise.promisifyAll(Object.getPrototypeOf(twitter));

function tweet(content) {
  if (content.length > 140) {
    return imageGenerator.generate(content).then(function (dataUrl) {
      console.log(dataUrl);
      return dataUrl.substr(dataUrl.indexOf(',') + 1);
    }).then(function (base64Data) {
      // upload the pic, then tweet it
      console.log("Tweeting article as image:");
      console.log(content);
      return postImage(base64Data);
    }).then(function (media) {
      return postMediaTweet('', media.media_id_string);
    });
  } else {
    console.log("Tweeting article:");
    console.log(content);
    return postTextTweet(content);
  }
}

function postTextTweet(content) {
  if (process.env.DEBUG) {
    return Promise.resolve({
      id_str: 'debug'
    });
  }
  return twitter.postAsync('statuses/update', {
    status: content
  });
}

function postMediaTweet(content, mediaId) {
  if (process.env.DEBUG) {
    return Promise.resolve({
      id_str: 'debug'
    });
  }
  return twitter.postAsync('statuses/update', {
    status: content,
    media_ids: mediaId
  });
}

function postImage(base64Data) {
  if (process.env.DEBUG) {
    return Promise.resolve({
      id_str: 'debug'
    });
  }
  return twitter.postAsync('media/upload', {
    media_data: base64Data
  });
}

module.exports = {
  tweet: tweet
};
