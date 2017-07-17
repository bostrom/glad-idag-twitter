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
    .catch(function (reason) {
      return Promise.reject(new Error('ERROR_FETCHING_ARTICLE_LIST'));
    })
    .then(function ($) {
      // return all found article ids in reverse order
      var articleElements = $("#content a[href^='/Artikel/VisaArtikel']").get();
      if (articleElements.length === 0) {
        return Promise.reject(new Error("ERROR_NO_ARTICLES_IN_LIST"));
      }
      return articleElements.map(function (article) {
        return $(article).attr('href').match(/\d+$/)[0];
      });
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
      var typeMatch = $('#content article > h1').text().match(/arg/ig) || [];
      var type = (typeMatch[0] || "").toLowerCase() === "arg" ? "arg" : "glad";

      return {type: type, content: content};
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
