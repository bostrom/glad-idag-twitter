'use strict';

// try to pick the db host and port from the followng sources in order:
// - a legacy docker LINK env variable (used by AWS)
// - a user defined env variable (may be overridden in docker run etc)
// - hard coded values (used by docker-compose and configured in docker-compose.yml)
var dbHost = process.env.DB_PORT_27017_TCP_ADDR || process.env.DB_HOST || 'db';
var dbPort = process.env.DB_PORT_27017_TCP_PORT || process.env.DB_PORT || 27017;

// hard code your twitter keys in the empty strings if
// you don't want to use the environment variables

var config = {
  creds: {
    mongoose_auth_local: 'mongodb://' + dbHost + ':' + dbPort + '/gladidag',
    twitterGlad: {
      twitter_consumer_key: process.env.TW_GLAD_CONSUMER_KEY || '',
      twitter_consumer_secret: process.env.TW_GLAD_CONSUMER_SECRET || '',
      twitter_access_token_key: process.env.TW_GLAD_ACCESS_TOKEN_KEY || '',
      twitter_access_token_secret: process.env.TW_GLAD_ACCESS_TOKEN_SECRET || '',
    },
    twitterArg: {
      twitter_consumer_key: process.env.TW_ARG_CONSUMER_KEY || '',
      twitter_consumer_secret: process.env.TW_ARG_CONSUMER_SECRET || '',
      twitter_access_token_key: process.env.TW_ARG_ACCESS_TOKEN_KEY || '',
      twitter_access_token_secret: process.env.TW_ARG_ACCESS_TOKEN_SECRET || ''
    }
  },
  pollIntervalSeconds: process.env.POLL_INTERVAL_SECONDS || 60
};

module.exports = config;
