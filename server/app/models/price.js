'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PriceSchema = Schema({
    time: Date, 
    usd: Number
});

module.exports = mongoose.model('Price', PriceSchema);   