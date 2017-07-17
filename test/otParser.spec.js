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
      .get(/Artikel\/Visa\/12345/)
      .reply(200, require('./fixtures/ot-article-page-glad.html'));

    nock('http://online.osterbottenstidning.fi')
      .get(/Artikel\/Visa\/67890/)
      .reply(200, require('./fixtures/ot-article-page-arg.html'));

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

    it("should reject if there's no articles in list", function () {
      // if the markup changes and the parser can't find the list
      nock.cleanAll();
      nock('http://online.osterbottenstidning.fi')
        .get(/Sida\/GladArg/)
        .reply(200, "<html><body></body></html>");

      return otParser.getArticleList().should.be.rejectedWith(Error, 'ERROR_NO_ARTICLES_IN_LIST');
    });

    it("should return an array of only numbers as strings", function (done) {
      otParser.getArticleList().then(function (list) {
        list.should.all.match(/^\d+$/);
        done();
      });
    });

    it("should return the article ids in the right order", function (done) {
      otParser.getArticleList().then(function (list) {
        expect(list[0]).to.equal('150721');
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

    it("should return a object", function (done) {
      otParser.getArticle(67890).then(function (article) {
        expect(typeof article).to.equal('object');
        done();
      });
    });

    describe("for arg idag articles", function () {
      it("should return the article content as property 'content'", function (done) {
        otParser.getArticle(67890).then(function (article) {
          expect(article.content).to.equal('Arg idag är en pappa i Baggholmen över hundskiten överallt, folk som kommer brännande med åtminstone 60 genom bostadsområdet fast barn står och leker på infarten, men mest över att någon slagit sönder roskisen vid Baggholmsparken så det låg brädor med spikar upp överallt och chips på marken som fullt med kråkor satt och åt. Allt detta på en promenad.');
          done();
        });
      });

      it("should return the article type as property 'type'", function (done) {
        otParser.getArticle(67890).then(function (article) {
          expect(article.type).to.equal('arg');
          done();
        });
      });
    });

    describe("for glad idag articles", function () {
      it("should return the article content as property 'content'", function (done) {
        otParser.getArticle(12345).then(function (article) {
          expect(article.content).to.equal('En Larsmobo är glad över Larsmos satsning på COOL. Bra och mångsidigt program. Man får vara stolt som Larsmobo.');
          done();
        });
      });

      it("should return the article type as property 'type'", function (done) {
        otParser.getArticle(12345).then(function (article) {
          expect(article.type).to.equal('glad');
          done();
        });
      });
    });

    it("should reject if the page request return a non 200 response", function () {
      nock.cleanAll();
      nock('http://online.osterbottenstidning.fi')
        .get(/Artikel\/Visa\/\d+/)
        .reply(404);

      return otParser.getArticle(67890).should.be.rejectedWith(Error, 'NO_ARTICLE_FOUND');
    });

    it("should reject if no articleId was given", function () {
      return otParser.getArticle().should.be.rejectedWith(Error, 'NO_ARTICLE_ID_GIVEN');
    });

    it("should reject if the article has no content", function () {
      nock.cleanAll();
      nock('http://online.osterbottenstidning.fi')
        .get(/Artikel\/Visa\/\d+/)
        .reply(200, require('./fixtures/ot-plus-article-page.html'));

      return otParser.getArticle(34567).should.be.rejectedWith(Error, 'NO_ARTICLE_CONTENT');
    });

  });

});
