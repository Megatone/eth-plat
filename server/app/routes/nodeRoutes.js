'use strict'

var express = require('express');
var NodeController = require('../controllers/nodeController');

var api = express.Router();

api.get('/get-node-info', NodeController.getNodeInfo);

api.post('/get-price-history', NodeController.getPriceHistory);

api.get('/get-eth-info', NodeController.getEthInfo);

module.exports = api;

