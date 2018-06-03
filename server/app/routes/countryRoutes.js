'use strict'

var express = require('express');
var CountryController = require('../controllers/countryController');

var api = express.Router();

api.get('/get-countries', CountryController.getCountries);

module.exports = api;

