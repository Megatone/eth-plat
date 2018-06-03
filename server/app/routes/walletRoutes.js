'use strict'

var express = require('express');
var WalletController = require('../controllers/walletController');
var md_Auth = require('../middlewares/authenticatedMiddleware');

var api = express.Router();

api.post('/get-wallets', md_Auth.ensureAuth, WalletController.getWallets);

api.post('/get-wallet', md_Auth.ensureAuth, WalletController.getWallet);

api.post('/new-wallet', md_Auth.ensureAuth, WalletController.newWallet);

api.post('/restore-wallet-from-private-key', md_Auth.ensureAuth, WalletController.restoreWalletFromPrivateKey);

api.post('/remove-wallet', md_Auth.ensureAuth, WalletController.removeWallet);

api.post('/get-balance', md_Auth.ensureAuth, WalletController.getBalance);

api.post('/update-wallet-name', md_Auth.ensureAuth, WalletController.updateWalletName);

api.post('/get-transactions', md_Auth.ensureAuth, WalletController.getTransactions);

api.post('/get-transaction', md_Auth.ensureAuth, WalletController.getTransaction);

module.exports = api;

