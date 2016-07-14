'use strict';

describe("the imageGenerator", function () {

  var
    imageGenerator,
    Promise = require('bluebird'),
    mockery = require('mockery'),
    glob = require('glob'),
    fs = require('fs'),
    sizeOf = require('image-size');

  beforeEach(function () {
    process.env.DEBUG = 1;
    imageGenerator = require('../lib/imageGenerator');
  });

  afterEach(function () {
    // remove all pngs created by the lib in debug mode
    var pngs = glob.sync('./lib/*.png');
    pngs.forEach(function (item, index, array) {
      fs.unlinkSync(item);
    });
    delete process.env.DEBUG;
  });

  it("should expose a generate function", function () {
    imageGenerator.should.respondTo('generate');
  });

  it("should return a promise", function () {
    expect(imageGenerator.generate('Hello world')).to.respondTo('then');
  });

  it("should generate an image data url", function () {
    return imageGenerator.generate('Hello world').should.eventually.match(/^data:image\/png;base64/);
  });

  it("should create a png file in debug mode", function () {
    expect(process.env.DEBUG).to.be.ok;
    return imageGenerator.generate('Hello world').then(function () {
      expect(glob.sync('./lib/*.png')).to.have.lengthOf(1);
    });
  });

  it("should not create a file if not in debug mode", function () {
    mockery.resetCache();
    delete process.env.DEBUG;
    expect(process.env.DEBUG).not.to.be.ok;
    imageGenerator = require('../lib/imageGenerator');
    return imageGenerator.generate('Hello world').then(function () {
      expect(glob.sync('./lib/*.png')).to.have.lengthOf(0);
    });
  });

  it("should generate equal width but longer png when there's plenty of text", function () {
    return Promise.all([
      imageGenerator.generate('Hello world'),
      imageGenerator.generate('Arg i dag är en boende på Vestersundsgatan över den usla skötseln av ekopunkten. Tydligen har den nya tömningsansvariga firman inte kapacitet att sköta tömningen på ett korrekt sätt. I torsdags svämmade kartongreturen över bredden, men observerade att sent på kvällen tömdes det. På plats fanns en vanlig sopbil utan kran. Nu måndag är kärlet fullt igen. Skärpning!')
    ]).then(function () {
      var images = glob.sync('./lib/*.png');
      // expect(images).to.have.lengthOf(2);
      var dimensions1 = sizeOf(images[0]);
      var dimensions2 = sizeOf(images[1]);
      expect(dimensions1.height).to.be.above(0);
      expect(dimensions1.height).to.be.below(dimensions2.height);
      expect(dimensions1.width).to.equal(dimensions2.width);
    });
  });

});
