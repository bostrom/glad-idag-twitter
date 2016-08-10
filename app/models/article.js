'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

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

module.exports = mongoose.model('Article', ArticleSchema);
