'use strict';

describe.only("the imageGenerator", function () {

  var
    imageGenerator,
    mockery = require('mockery'),
    glob = require('glob'),
    fs = require('fs');

  beforeEach(function () {
    process.env.DEBUG = true;
    imageGenerator = require('../lib/imageGenerator');
  });

  afterEach(function () {
    glob('./lib/*.png', function (err, files) {
      console.log(files);
      files.forEach(function (item, index, array) {
        console.log(item);
      });
    });
  });

  it("should expose a generate function", function () {
    imageGenerator.should.respondTo('generate');
  });

  it("should generate an image data url", function () {
    expect(imageGenerator.generate('Hello world')).to.match(/^data:image\/png;base64/);
  });


});
