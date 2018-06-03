'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TransactionSchema = Schema({
    blockNumber: Number,
    timeStamp: Number,
    hash: String,
    nonce: Number,
    blockHash: String,
    transactionIndex: Number,
    from: String,
    to: String,
    value: Number,
    gas: Number,
    gasPrice: Number,
    isError: Number,
    txreceipt_status: Number,
    input: String,
    contractAddress: String,
    cumulativeGasUsed: Number,
    gasUsed: Number,
    confirmations: Number,
    wallet: {
        type: Schema.ObjectId,
        ref: 'Wallet'
    },
    user: {
        type: Schema.ObjectId,
        ref: 'User'
    }
});

module.exports = mongoose.model('Transaction', TransactionSchema);