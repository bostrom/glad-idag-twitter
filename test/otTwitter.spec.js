'use strict';

var Promise = require('bluebird'),
  mockery = require('mockery'),
  nock = require('nock'),
  otTwitter;

describe("otTwitter", function () {

  var TwitterSpy, imageGeneratorStub, postAsyncStub, shortContent, longContent;

  beforeEach(function () {
    // disable net connections just in case
    nock.disableNetConnect();

    // Create mock Twitter library
    mockery.enable({
      useCleanCache: true,
      warnOnReplace: false,
      warnOnUnregistered: false
    });

    postAsyncStub = sinon.stub();
    postAsyncStub.withArgs('media/upload', {
      media_data: 'my-data-url'
    }).returns(Promise.resolve({
      media_id_string: 'media-id-string'
    }));
    postAsyncStub.returns(Promise.resolve({
      success: true
    }));

    exports.Twitter = function () { /* Twitter constructor Mock */ };
    exports.Twitter.prototype.postAsync = postAsyncStub;

    TwitterSpy = sinon.spy(exports, 'Twitter');
    mockery.registerMock('twitter', TwitterSpy);

    imageGeneratorStub = sinon.stub();
    imageGeneratorStub.returns(Promise.resolve('my-data-url'));
    mockery.registerMock('./imageGenerator', {
      generate: imageGeneratorStub
    });

    // load the twitter client, which requires the (now mocked) Twitter lib
    var OtTwitter = require('../lib/otTwitter');
    otTwitter = new OtTwitter({
      twitter_consumer_key: 'my_consumer_key',
      twitter_consumer_secret: 'my_consumer_secret',
      twitter_access_token_key: 'my_access_token_key',
      twitter_access_token_secret: 'my_access_token_secret'
    });

    shortContent = 'Hello world';
    longContent = 'Arg i dag är en boende på Vestersundsgatan över den usla skötseln av ekopunkten. Tydligen har den nya tömningsansvariga firman inte kapacitet att sköta tömningen på ett korrekt sätt. I torsdags svämmade kartongreturen över bredden, men observerade att sent på kvällen tömdes det. På plats fanns en vanlig sopbil utan kran. Nu måndag är kärlet fullt igen. Skärpning!';
  });

  afterEach(function () {
    mockery.disable();
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it("should create a new instance of the twitter client", function () {
    TwitterSpy.should.have.been.calledWithNew;
  });

  it("should pass the needed credentials the config to the twitter client constructor", function () {
    TwitterSpy.should.have.been.calledWith({
      consumer_key: 'my_consumer_key',
      consumer_secret: 'my_consumer_secret',
      access_token_key: 'my_access_token_key',
      access_token_secret: 'my_access_token_secret'
    });
  });

  it("should expose a tweet function", function () {
    expect(otTwitter).to.respondTo('tweet');
  });

  describe("function tweet", function () {

    it("should return a promise", function () {
      expect(otTwitter.tweet(shortContent)).to.respondTo('then');
    });

    it("should call the twitter client postAsync method with correct parameters", function () {
      return otTwitter.tweet(shortContent).then(function () {
        postAsyncStub.should.have.been.calledOnce;
        postAsyncStub.should.have.been.calledWith('statuses/update', {
          status: shortContent
        });
      });
    });

    it("should return whatever the twitter client returns", function () {
      return otTwitter.tweet(shortContent).should.eventually.become({
        success: true
      });
    });

    describe("when content is longer than 140 characters", function () {
      var promise;
      beforeEach(function () {
        promise = otTwitter.tweet(longContent);
      });

      it("should generate an image data url if the tweet is longer than 140 characters", function () {
        return promise.then(function () {
          expect(imageGeneratorStub).to.have.been.calledWith(longContent);
        });
      });

      it("should post the image to twitter", function () {
        return promise.then(function () {
          expect(postAsyncStub).to.have.been.calledWith('media/upload', {
            media_data: 'my-data-url'
          });
        });
      });

      it("should tweet the generated image", function () {
        return promise.then(function () {
          expect(postAsyncStub).to.have.been.calledWith('statuses/update', {
            status: '',
            media_ids: 'media-id-string'
          });
        });
      });
    });

    describe("when in DEBUG mode", function () {
      beforeEach(function () {
        mockery.resetCache();
        process.env.DEBUG = true;

        var OtTwitter = require('../lib/otTwitter');
        otTwitter = new OtTwitter({
          twitter_consumer_key: 'my_consumer_key',
          twitter_consumer_secret: 'my_consumer_secret',
          twitter_access_token_key: 'my_access_token_key',
          twitter_access_token_secret: 'my_access_token_secret'
        });
      });

      it("should not call the twitter client with short messages", function () {
        return otTwitter.tweet(shortContent).then(function () {
          expect(postAsyncStub).not.to.have.been.called;
        });
      });

      it("should return a debug response with short messages", function () {
        otTwitter.tweet(shortContent).should.eventually.become({
          id_str: 'debug'
        });
      });

      it("should not call the twitter client with long messages", function () {
        return otTwitter.tweet(longContent).then(function () {
          expect(postAsyncStub).not.to.have.been.called;
        });
      });

      it("should return a debug response with long messages", function () {
        otTwitter.tweet(longContent).should.eventually.become({
          id_str: 'debug'
        });
      });

    });

  });
});
