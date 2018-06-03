'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var NodeInformationSchema = Schema({
  users: Number,
  wallets: Number,
  transactions: Number,
  pendingBlocks: Number,
  percentProgress: Number,
  price_usd: Number,
  price_btc: Number
});

module.exports = mongoose.model('NodeInformation', NodeInformationSchema);   