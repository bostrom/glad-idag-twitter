# Glad idag / arg idag Twitter bot

[![Dependency Status](https://img.shields.io/david/bostrom/glad-idag-twitter.svg)](https://david-dm.org/bostrom/glad-idag-twitter)
[![devDependency Status](https://img.shields.io/david/dev/bostrom/glad-idag-twitter.svg)](https://david-dm.org/bostrom/glad-idag-twitter#info=devDependencies)
[![Build Status](https://img.shields.io/travis/bostrom/glad-idag-twitter.svg)](https://travis-ci.org/bostrom/glad-idag-twitter)
[![Code Coverage](https://img.shields.io/coveralls/bostrom/glad-idag-twitter.svg)](https://coveralls.io/github/bostrom/glad-idag-twitter)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](https://opensource.org/licenses/ICS)

A Twitter bot for publishing the reader's comments a.k.a. "Glad idag / Arg idag" from the Österbottens Tidning newspaper to Twitter. The articles express the reader's satisfaction or dissatisfaction regarding anything and are not related to the newspaper in any way.

## How it works

The bot scrapes one article per minute from [Österbottens Tidning](http://online.osterbottenstidning.fi/Sida/GladArg) and publishes it to one of two different twitter accounts based on whether it expresses satisfaction ([Glad idag](https://twitter.com/GladidagOT)) or dissatisfaction ([Arg idag](https://twitter.com/ArgidagOT)).

Since the maximum length of Twitter posts is 140 characters and the articles are often longer than that, the bot converts longer articles into images and posts the image to Twitter instead.

## Getting it

    git clone git@github.com:bostrom/glad-idag-twitter.git
    cd glad-idag-twitter
    npm install --production

Note that glad-idag-twitter uses [node-canvas](https://github.com/Automattic/node-canvas) under the hood. For glad-idag-twitter's dependencies to install, you might have to fulfill the [installation requirements for node-canvas](https://github.com/Automattic/node-canvas#installation). Please refer to their documentation for instructions.

## Configuring it

The bot needs to be configured with keys for the Twitter accounts and host/port to a MongoDB database for bookkeeping. The values are read from the following environment variables:

|        Environment variable(s)        | Required | Default value |              Description               |
| ------------------------------------- | -------- | ------------- | -------------------------------------- |
| `TW_GLAD_CONSUMER_KEY`                | Yes      | ""            | Twitter account #1 consumer key        |
| `TW_GLAD_CONSUMER_SECRET`             | Yes      | ""            | Twitter account #1 consumer secret     |
| `TW_GLAD_ACCESS_TOKEN_KEY`            | Yes      | ""            | Twitter account #1 access token key    |
| `TW_GLAD_ACCESS_TOKEN_SECRET`         | Yes      | ""            | Twitter account #1 access token secret |
| `TW_ARG_CONSUMER_KEY`                 | Yes      | ""            | Twitter account #2 consumer key        |
| `TW_ARG_CONSUMER_SECRET`              | Yes      | ""            | Twitter account #2 consumer secret     |
| `TW_ARG_ACCESS_TOKEN_KEY`             | Yes      | ""            | Twitter account #2 access token key    |
| `TW_ARG_ACCESS_TOKEN_SECRET `         | Yes      | ""            | Twitter account #2 access token secret |
| `DB_PORT_27017_TCP_ADDR` or `DB_HOST` | No       | "db"          | Database hostname                      |
| `DB_PORT_27017_TCP_PORT` or `DB_PORT` | No       | 27017         | Database port                          |
| `POLL_INTERVAL_SECONDS`               | No       | 60            | New article poll interval (seconds)    |
| `DEBUG`                               | No       | false         | Turns on debug mode                    |

## Running it

The bot is able to run either locally or in a [Docker](https://www.docker.com/) container.

### In a Docker container

The supplied `Dockerfile` and `docker-compose.yml` provides means for the bot to run in a Docker container (actually two containers, one for the server and one for the database instance).

Make sure you have Docker installed and running on your host.

Make a copy of the environment variable configuration file `config/web-variables-example.env` and call it `config/web-variables.env`. Replace the dummy variable values, save, and run `docker-compose up`.

    cp config/web-variables{-example,}.env
    vi config/web-variables.env
    docker-compose up                        # ctrl-C exits

### Locally

Make sure you have a MongoDB database instance running on your host. Set the needed configuration environemnt variables and run `npm start`. Example:

    DEBUG=1 DB_HOST=localhost npm start

If you don't want to install MongoDB on your host, you can run it in a Docker container and have your local glad-idag-twitter process connect to the container.

    docker run -d -p 27017:27017 --name gladidagmongo mongo:latest    # start a mongo container
    docker-machine ip default                                         # check the ip of your docker machine
    DEBUG=1 DB_HOST=192.168.99.100 npm start                          # make the bot connect to the mongo container

### In debug mode

Set the `DEBUG` environment variable to any value to turn on debug mode. Debug mode means that

* the bot doesn't actually tweet the articles.
* the the database is still updated with bookeeping information.
* the generated images (if article is longer than 140 characters) are saved in the lib folder.

## Testing it

To run unit tests, install the devlopment dependencies and run `npm test`.

    npm install         # no --production flag this time
    npm test            # ctrl-C exits

A test coverage report will be generated in `coverage/lcov-report/index.html`.

## License

ISC License (ISC)

Copyright (c) 2016, Fredrik Boström

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
