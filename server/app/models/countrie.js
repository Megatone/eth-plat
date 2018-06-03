'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CountrieSchema = Schema({
    name: String,
    code: String
});

module.exports = mongoose.model('Countrie', CountrieSchema);   