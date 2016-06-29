'use strict';

var jsdom = require("jsdom"),
  mongoose = require('mongoose'),
  twitterClient = require('./app/twitterClient'),
  config = require('./config/config'),
  imageGenerator = require('./app/imageGenerator'),
  db = mongoose.connect(config.creds.mongoose_auth_local),
  Article = require('./app/models/article'),
  gladArgListUrl = 'http://online.osterbottenstidning.fi/Sida/GladArg',
  gladArgArticleUrl = 'http://online.osterbottenstidning.fi/Artikel/Visa/',
  intervalSeconds = 60;

function exec() {
  console.log('Harvesting articles');
  // crawl
  jsdom.env(
    gladArgListUrl, ["http://code.jquery.com/jquery.js"],
    processGladArgPage
  );
  setTimeout(function () {
    exec();
  }, intervalSeconds * 1000);
}

function processGladArgPage(err, window) {
  var $ = window.$;
  var slowDown = false;

  // iterate all articles in reverse order
  $($(".list a").get().reverse()).each(function (index) {
    var articleId = $(this).attr('href').match(/\d+$/)[0];

    // Check if we have it in the db already
    Article.findOrCreate({
      articleId: articleId
    }, function (err, article, created) {
      // if the article is not tweeted
      // and we're not slowing down the tweet rate
      // then tweet it
      if (!article.tweetId && !slowDown) {
        console.log("Found new article: " + articleId);
        slowDown = true;
        tweetContent(article);
      }
    });
  });
}

function tweetContent(article) {

  var tweetcallback = function tweetContent(error, tweet, response) {
    if (error) {
      console.log("HTTP CODE: %s", response.statusCode);
      console.log(error);
      switch (error[0].code) {
      case 88:
        // { "code": 88, "message": "Rate limit exceeded" }
        intervalSeconds = 120;
        break;
      case 186:
        // { code: 186, message: 'Status is over 140 characters.' }
        article.tweetId = 'too-long';
        article.save();
        break;
      case 187:
        // { "code": 187, "message": "Status is a duplicate." }
        article.tweetId = 'tweeted-unknown';
        article.save();
        break;
      }
    } else {
      article.tweetId = tweet.id_str;
      article.save();
    }
  };

  jsdom.env(
    gladArgArticleUrl + article.articleId, ["http://code.jquery.com/jquery.js"],
    function (err, window) {
      var content = window.$('#article-body').text();

      if (config.debug) {
        console.log('DEBUG mode, not tweeting. Tweet would be:');
        console.log(content);
        return;
      }

      if (content.length === 0) {
        console.log('PLUS article, no article. Marking as tweeted anyway');
        article.tweetId = 'plus-article';
        article.save();
        return;
      }

      console.log("Tweeting content %s", content);

      if (content.length > 140) {
        console.log("Content longer than 140, generating pic");
        var dataUrl = imageGenerator.generate(content);
        console.log(dataUrl);
        var base64Data = dataUrl.substr(dataUrl.indexOf(',') + 1);
        twitterClient.image(base64Data, function (error, media, response) {
          if (error) {
            console.log(error);
            return;
          }
          console.log(media);
          console.log('Tweeting with image ' + media.media_id_string);
          twitterClient.mediaTweet('', media.media_id_string, tweetcallback);
        });
      } else {
        twitterClient.tweet(content, tweetcallback);
      }
    }
  );
}

// let's go!
exec();
