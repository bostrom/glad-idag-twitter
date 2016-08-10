'use strict';

var config = require('../config/config'),
  Promise = require('bluebird'),
  otTwitter = require('../lib/otTwitter'),
  otParser = require('../lib/otParser'),
  _ = require('lodash'),
  mongoose = require('mongoose'),
  db = mongoose.connect(config.creds.mongoose_auth_local),
  Article = require('./models/article');

mongoose.Promise = require('bluebird');

// start working
console.log('Starting processing...');
console.log('Debug is ' + !!process.env.DEBUG);
processGladIdag();

function processGladIdag() {
  findUntweetedArticleInDb()

  .then(function (article) {
    if (article) {
      return tweetArticle(article);
    } else {
      return getMoreArticlesFromWeb().then(tweetArticle);
    }
  })

  .catch(function (e) {
    switch (e.message) {
    case 'NO_NEW_ARTICLES':
      process.stdout.write('.');
      break;
    default:
      console.log(e.message);
    }
  })

  .finally(function () {
    // set a timer to re-run after pollIntervalSeconds seconds
    setTimeout(processGladIdag, config.pollIntervalSeconds * 1000);
  });
}

function findUntweetedArticleInDb() {
  return Article.find({
    tweetId: {
      $exists: false
    }
  }).then(function (articles) {
    return articles.length ? articles[0] : undefined;
  });
}

function getMoreArticlesFromWeb() {
  // if no untweeted article in db, get all articles from ÖT web
  return otParser.getArticleList()

  .then(function (onlineArticleIds) {
    // find out which articles are already in db
    return Article.find({
      articleId: {
        $in: onlineArticleIds
      }
    })

    .then(function (existingArticles) {
      // get only id from the article, so we can...
      var existingArticleIds = _.map(existingArticles, 'articleId');
      // compare it to the ones from the web,
      // taking only those that don't exist in database
      var newArticleIds = _.difference(onlineArticleIds, existingArticleIds);

      // reject if we don't have any new articles
      if (!newArticleIds.length) {
        return Promise.reject(new Error('NO_NEW_ARTICLES'));
      }

      // othewise save all new article ids in the db
      // reverse order since the web parsed them from newest to oldest
      var savePromises = _.map(newArticleIds.reverse(), function (articleId) {
        return Article.create({
          articleId: articleId
        });
      });
      return Promise.all(savePromises);
    })

    .then(function (savedArticles) {
      // return the oldest new article
      return savedArticles[0];
    });
  });
}

function tweetArticle(article) {
  // get the article content from the web
  return otParser.getArticle(article.articleId)

  .then(function (articleBody) {
    return otTwitter.tweet(articleBody);
  })

  .then(function (tweet) {
    // tweeting succeeded, save the tweet id in the db
    article.tweetId = tweet.id_str;
    return article.save();
  })

  .catch(function (e) {
    var errorKey = e.errors ? e.errors[0].code : e.message;

    // this is a twitter API error
    switch (errorKey) {
    case 'NO_ARTICLE_CONTENT':
      console.log('No article content. Marking article as plus article.');
      article.tweetId = 'plus-article';
      return article.save();
    case 187:
      // { "code": 187, "message": "Status is a duplicate." }
      console.log('Duplicate tweet. Marking article as duplicate.');
      article.tweetId = 'tweeted-duplicate';
      return article.save();
    default:
      Promise.reject(e);
    }
  });
}
