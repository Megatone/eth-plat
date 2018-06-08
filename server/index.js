'use strict'

var mongoose = require('mongoose');
var c = require('./app/utils/console/console');
var app = require('./app/app');
var settings = require('./config/settings');
var cronJobs = require('./app/jobs/cron');
var socketsService = require('./app/sockets/service');

//Connect to Mongo DB
mongoose.Promise = global.Promise;



mongoose.connect('mongodb://root:LZdyNO4NbG0jW97q@cluster0-shard-00-00-n9itl.mongodb.net:27017,cluster0-shard-00-01-n9itl.mongodb.net:27017,cluster0-shard-00-02-n9itl.mongodb.net:27017/ethereum_platform?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true', { useMongoClient: true }).then(() => {
    app.listen(8000, () => {
//mongoose.connect('mongodb://' + settings.mongo.user + ':' + settings.mongo.password + '@' + settings.mongo.server + '/' + settings.mongo.database + '?retryWrites=true', { useMongoClient: true }).then(() => {
    c.success('Application database connection with Mongo are be success');
    c.info('MongoDb Server "' + settings.mongo.server + '"');
    c.info('MongoDb Port "' + settings.mongo.port + '"');
    c.info('MongoDb Database "' + settings.mongo.database + '"');
    socketsService.initSocketService();
    cronJobs.initJob();
    });
}).catch(err => {
    c.danger(err)
});
