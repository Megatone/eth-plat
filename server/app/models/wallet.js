'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var WalletSchema = Schema({
    address: String,
    privateKey: String,
    password: String,
    balance: Number,
    registerDate: String,
    updateDate: String,
    user: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    name: String,    
    down: Boolean
});

module.exports = mongoose.model('Wallet', WalletSchema);