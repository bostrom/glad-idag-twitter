'use strict';

var Promise = require('bluebird'),
  request = require('request-promise'),
  cheerio = require('cheerio'),
  gladArgListUrl = 'http://online.osterbottenstidning.fi/Sida/GladArg',
  gladArgArticleUrl = 'http://online.osterbottenstidning.fi/Artikel/Visa/';

function getArticleList() {
  return request({
      uri: gladArgListUrl,
      transform: function (body) {
        return cheerio.load(body);
      }
    })
    .then(function ($) {
      // return all found article ids in reverse order
      return $(".list a").get().map(function (article) {
        return $(article).attr('href').match(/\d+$/)[0];
      });
    })
    .catch(function (reason) {
      return Promise.reject(new Error('ERROR_FETCHING_ARTICLE_LIST'));
    });
}

function getArticle(articleId) {
  if (!articleId) {
    return Promise.reject(new Error("NO_ARTICLE_ID_GIVEN"));
  }

  return request({
      uri: gladArgArticleUrl + articleId,
      transform: function (body) {
        return cheerio.load(body);
      }
    })
    .then(function ($) {
      var content = $('#article-body').text();
      if (content.length === 0) {
        throw new Error('no_content');
      }
      return content;
    })
    .catch(function (e) {
      if (e.message === 'no_content') {
        return Promise.reject(new Error("NO_ARTICLE_CONTENT"));
      }
      return Promise.reject(new Error("NO_ARTICLE_FOUND"));
    });
}

module.exports = {
  getArticleList: getArticleList,
  getArticle: getArticle
};
