'use strict';

var otParser = require('../lib/otParser'),
  fs = require('fs'),
  nock = require('nock');

describe("the OT parser", function () {

  beforeEach(function () {
    require.extensions['.html'] = function (module, filename) {
      module.exports = fs.readFileSync(filename, 'utf8');
    };

    nock.disableNetConnect();

    nock('http://online.osterbottenstidning.fi')
      .get(/Sida\/GladArg/)
      .reply(200, require('./fixtures/ot-list-page.html'));

    nock('http://online.osterbottenstidning.fi')
      .get(/Artikel\/Visa\/\d+/)
      .reply(200, require('./fixtures/ot-article-page.html'));
  });

  afterEach(function () {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it("should export a getArticleList function", function () {
    expect(otParser).to.respondTo('getArticleList');
  });

  it("should export a getArticle function", function () {
    expect(otParser).to.respondTo('getArticle');
  });

  describe("the getArticleList function", function () {

    it("should eventually return an array", function () {
      return expect(otParser.getArticleList()).to.eventually.be.instanceof(Array);
    });

    it("should return the correct number of article ids in the array", function () {
      return expect(otParser.getArticleList()).to.eventually.have.length(50);
    });

    it("should return an array of only numbers as strings", function (done) {
      otParser.getArticleList().then(function (list) {
        list.should.all.match(/^\d+$/);
        done();
      });
    });

    it("should return the article ids in the right order", function (done) {
      otParser.getArticleList().then(function (list) {
        expect(list[0]).to.equal('107695');
        done();
      });
    });

    it("should return a rejected promise if request returned a non 200 response", function () {
      nock.cleanAll();
      nock('http://online.osterbottenstidning.fi')
        .get(/Sida\/GladArg/)
        .reply(404);

      return otParser.getArticleList().should.be.rejectedWith(Error, 'ERROR_FETCHING_ARTICLE_LIST');
    });

  });

  describe("the getArticle function", function () {

    it("should return a string", function (done) {
      otParser.getArticle(12345).then(function (article) {
        expect(typeof article).to.equal('string');
        done();
      });
    });

    it("should return the article content", function () {
      return otParser.getArticle(12345).should.eventually.equal('arg i dag är mamman till personen som var inblandad i singelolyckan i Esse på midsommardagen över den grova kommentaren som en cyklande förbipasserande fällde. ');
    });

    it("should reject if the page request return a non 200 response", function () {
      nock.cleanAll();
      nock('http://online.osterbottenstidning.fi')
        .get(/Artikel\/Visa\/\d+/)
        .reply(404);

      return otParser.getArticle(12345).should.be.rejectedWith(Error, 'NO_ARTICLE_FOUND');
    });

    it("should reject if no articleId was given", function () {
      return otParser.getArticle().should.be.rejectedWith(Error, 'NO_ARTICLE_ID_GIVEN');
    });

    it("should reject if the article has no content", function () {
      nock.cleanAll();
      nock('http://online.osterbottenstidning.fi')
        .get(/Artikel\/Visa\/\d+/)
        .reply(200, require('./fixtures/ot-plus-article-page.html'));

      return otParser.getArticle(12345).should.be.rejectedWith(Error, 'NO_ARTICLE_CONTENT');
    });

  });

});
