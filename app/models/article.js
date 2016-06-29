'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  findOrCreate = require('mongoose-findorcreate');

var ArticleSchema = new Schema({
  articleId: {
    type: String,
    required: true,
    unique: true
  },
  tweetId: {
    type: String
  }
});

ArticleSchema.plugin(findOrCreate);

module.exports = mongoose.model('Article', ArticleSchema);
