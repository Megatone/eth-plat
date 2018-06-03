'use strict'

//load libs
const settings = require('../../config/settings');
var bcrypt = require('bcrypt-nodejs');
var ethers = require('ethers');
var validator = require('../utils/validate/validate');
var formatter = require('../utils/format/format');
var c = require('../utils/console/console');
var request = require('request');

//load models
var User = require('../models/user');
var Wallet = require('../models/wallet');
var Transaction = require('../models/transaction');

var ETH = ethers.Wallet;
//var ETHProvider = new ethers.providers.getDefaultProvider(false);
var ETHProvider = new ethers.providers.JsonRpcProvider(settings.jsonRPCService.url);

//actions
function getWallets(req, res) {
    try {
        Wallet.find({ user: req.user.sub, down: false }, { privateKey: 0, password: 0, down: 0 }, (err, walletsSearched) => {
            if (err) {
                c.danger('File : WalletController -> Function : getWallets() -> Wallet.find() -> ' + err.stack);
                return res.status(406).send({ message: 'Error: can not connect to the database to get wallets.' });
            }

            if (walletsSearched.length === 0)
                return res.status(200).send({ message: 'Not have Wallets', wallets: [] });

            return res.status(200).send({ wallets: walletsSearched, message: 'Wallets listed' });
        }).populate({ path: 'user', select: { password: 0  , totp : 0} });
    } catch (err) {
        c.danger('File : UserController -> Function : getWallets() -> ' + err.stack);
        return res.status(500).send({ message: 'Server Error' });
    }
};

function getWallet(req, res) {
    try {
        var params = req.body;
        if (!(params && params.walletId))
            return res.status(406).send({ message: 'Parameter not valid.' });

        Wallet.findOne({ user: req.user.sub, _id: params.walletId, down: false }, { privateKey: 0, password: 0, down: 0 })
            .exec((err, walletSearched) => {
                if (err) {
                    c.danger('File : WalletController -> Function : getWallets() -> Wallet.find() -> ' + err.stack);
                    return res.status(406).send({ message: 'Error: can not connect to the database to get wallet.' });
                }

                if (walletSearched)
                    return res.status(200).send({ wallet: walletSearched, message: 'Wallet Found' });

                return res.status(406).send({ message: 'Not have this Wallet', wallet: {} });
            });
    } catch (err) {
        c.danger('File : UserController -> Function : getWallet() -> ' + err.stack);
        return res.status(500).send({ message: 'Server Error' });
    }
};

function newWallet(req, res) {
    try {
        var params = req.body;
        if (!(params && params.walletName))
            return res.status(406).send({ message: 'Parameter not valid.' });

        var eth_wallet = ETH.createRandom();

        var wallet = new Wallet();
        wallet.user = req.user.sub;
        wallet.name = params.walletName
        wallet.address = eth_wallet.address;
        wallet.privateKey = eth_wallet.privateKey;
        wallet.password = '';
        wallet.balance = 0;
        wallet.registerDate = Math.floor(Date.now() / 1000);
        wallet.updateDate = Math.floor(Date.now() / 1000);
        wallet.down = false;

        wallet.save((err, newWalletStored) => {
            if (err) {
                c.danger('File : WalletController -> Function : newwallet() -> walle.save() -> ' + err.stack);
                return res.status(406).send({ message: 'Error: can not connect to the database to create wallet.' });
            }

            if (!newWalletStored)
                return res.status(406).send({ message: 'The wallet has not created.' });

            newWalletStored.privateKey = undefined;
            newWalletStored.password = undefined;

            return res.status(200).send({
                wallet: newWalletStored,
                message: 'New wallet created successfully.'
            });
        });
    } catch (err) {
        c.danger('File : UserController -> Function : newWallet() -> ' + err.stack);
        return res.status(500).send({ message: 'Server Error' });
    }
};

function restoreWalletFromPrivateKey(req, res) {
    try {
        var params = req.body;
        if (!(params && params.privateKey))
            return res.status(406).send({ message: 'Parameter not valid.' });

        Wallet.findOne({ privateKey: params.privateKey, user: req.user.sub }, (err, walletSearched) => {
            if (err) {
                c.danger('File : WalletController -> Function : restoreWalletFromPrivateKey() -> Wallet.findOne() -> ' + err.stack);
                return res.status(406).send({ message: 'Error: can not connect to the database to check existent wallet from user.' });
            }
            if (walletSearched) {
                walletSearched.password = undefined;
                walletSearched.privateKey = undefined;
                walletSearched.down = undefined;
                return res.status(200).send({
                    wallet: walletSearched,
                    message: 'Wallet imported successfully.'
                });
            } else {
                try {
                    if (!validator.validatePrivateKey(params.privateKey))
                        return res.status(406).send({ message: 'Private Key not Valid' });

                    var formatPrivateKey = formatter.formatPrivateKey(params.privateKey);

                    var eth_wallet = new ethers.Wallet(formatPrivateKey);
                    var wallet = new Wallet();
                    wallet.user = req.user.sub;
                    wallet.address = eth_wallet.address;
                    wallet.privateKey = eth_wallet.privateKey;
                    wallet.password = '';
                    wallet.balance = 0;
                    wallet.registerDate = Math.floor(Date.now() / 1000);
                    wallet.updateDate = Math.floor(Date.now() / 1000);
                    wallet.down = false;

                    wallet.save((err, newWalletStored) => {
                        if (err) {
                            c.danger('File : WalletController -> Function : newwallet() -> walle.save() -> ' + err.stack);
                            return res.status(406).send({ message: 'Error: can not connect to the database to create wallet.' });
                        }

                        if (!newWalletStored)
                            return res.status(406).send({ message: 'The wallet has not created.' });

                        newWalletStored.privateKey = undefined;
                        newWalletStored.password = undefined;
                        newWalletStored.down = false;

                        return res.status(200).send({
                            wallet: newWalletStored,
                            message: 'Wallet imported successfully.'
                        });
                    });
                } catch (err) {
                    return res.status(406).send({ message: 'Bad Private key.' });
                }
            }
        });
    } catch (err) {
        c.danger('File : UserController -> Function : restoreWalletFromPrivateKey() -> ' + err.stack);
        return res.status(500).send({ message: 'Server Error' });
    }
};

function restoreWalletFromEncryptedWallet() {
};

function restoreWalletFromMnemonic() {
};

function removeWallet(req, res) {
    try {
        var params = req.body;
        if (!(params && params.walletId && params.password))
            return res.status(406).send({ message: 'Parameter not valid.' });

        User.findOne({ _id: req.user.sub }, (err, user) => {
            if (err) {
                c.danger('File : WalletController -> Function : removeWallet() -> User.findOne() -> ' + err.stack);
                return res.status(406).send({ message: 'Error: can not connect to the database to remove wallet.' });
            }

            bcrypt.compare(params.password, user.password, (err, check) => {
                if (err) {
                    c.danger('File : WalletController -> Function : removeWallet() -> bcrypt.compare() -> ' + err.stack);
                    return res.status(406).send({ message: 'Error: can not compare encrypted passwords.' });
                }
                if (!check)
                    return res.status(406).send({ message: 'The password is not correct' });

                Wallet.findByIdAndUpdate(params.walletId, { down: true }, { new: true }, (err, walletRemoved) => {
                    if (err) {
                        c.danger('File : WalletController -> Function : removeWallet() -> Wallet.findOneAndUpdate() -> ' + err.stack);
                        return res.status(406).send({ message: 'Error: can not connect to the database to remove wallet from user.' });
                    }
                    if (!walletRemoved)
                        return res.status(406).send({ message: 'The wallet not exists.' });

                    return res.status(200).send({ message: 'The wallet ' + walletRemoved.address + ' removed successfully.' });
                });
            });
        });

    } catch (err) {
        c.danger('File : UserController -> Function : removeWallet() -> ' + err.stack);
        return res.status(500).send({ message: 'Server Error' });
    }
};

function getBalance(req, res) {
    try {
        var params = req.body;
        if (!(params && params.walletId))
            return res.status(406).send({ message: 'Parameters not valid' });

        Wallet.findOne({ _id: params.walletId, user: req.user.sub }, (err, walletSearched) => {
            if (err) {
                c.danger('File : WalletController -> Function : getBalance() -> Wallet.findOne() -> ' + err.stack);
                return res.status(406).send({ message: 'Error: can not connect to the database to get balance wallet from user.' });
            }
            if (!walletSearched)
                return res.status(406).send({ message: 'The wallet not exists.' });

            if (!validator.validatePrivateKey(walletSearched.privateKey))
                return res.status(406).send({ message: 'Error on Private Key , Contact Administrator' });

            var formatPrivateKey = formatter.formatPrivateKey(walletSearched.privateKey);

            var eth_wallet = new ethers.Wallet(formatPrivateKey);
            eth_wallet.provider = ETHProvider;
            eth_wallet.getBalance('pending').then(function (balance) {
                var formatBalance = ethers.utils.formatEther(balance, { commify: true });
                walletSearched.balance = formatBalance;
                walletSearched.updateDate = Math.floor(Date.now() / 1000);

                Wallet.findByIdAndUpdate(walletSearched._id, walletSearched, { new: true }, (err, walletUpdate) => {
                    if (err) {
                        c.danger('File : WalletController -> Function : getBalance() -> Wallet.findByIdAndUpdate() -> ' + err.stack);
                        return res.status(406).send({ message: 'Error: can not connect to the database to update balance wallet from user.' });
                    }
                    if (!walletUpdate)
                        return res.status(406).send({ message: 'The wallet not updated.' });
                    return res.status(200).send({ balance: walletUpdate.balance, message: 'Balance Refreshed' });
                });
            }, function (error) {
                return res.status(406).send({ message: 'Error : can not get balance' });
            });
        });
    } catch (err) {
        c.danger('File : UserController -> Function : getBalance() -> ' + err.stack);
        return res.status(500).send({ message: 'Server Error' });
    }
};

function updateWalletName(req, res) {
    try {
        var params = req.body;
        if (!(params && params.walletId && params.walletName))
            return res.status(406).send({ message: 'Parameters not valid' });

        Wallet.findOneAndUpdate({ _id: params.walletId, user: req.user.sub }, { name: params.walletName }, { new: true }, (err, walletSearched) => {
            if (err) {
                c.danger('File : WalletController -> Function : updateWalletName() -> Wallet.findOneAndUpdate() -> ' + err.stack);
                return res.status(406).send({ message: 'Error: can not connect to the database to update  wallet name from user.' });
            }
            if (!walletSearched)
                return res.status(406).send({ message: 'The wallet not exists.' });

            return res.status(200).send({ message: 'The wallet name updated successfully.' });
        });
    } catch (err) {
        c.danger('File : UserController -> Function : updateWalletName() -> ' + err.stack);
        return res.status(500).send({ message: 'Server Error' });
    }

}

function getTransactions(req, res) {
    try {
        var params = req.body;

        if (!(params && params.walletId))
            return res.status(406).send({ message: 'Parameters not valid' });

        Wallet.findOne({ _id: params.walletId, user: req.user.sub }, (err, walletSearched) => {
            if (err) {
                c.danger('File : WalletController -> Function : getTransactions() -> Wallet.findOne() -> ' + err.stack);
                return res.status(406).send({ message: 'Error: can not connect to the database to get wallet transactions.' });
            }

            if (!walletSearched)
                return res.status(406).send({ message: 'The wallet not exists.' });

            request('http://api.etherscan.io/api?module=account&action=txlist&address=' + walletSearched.address + '&startblock=0&endblock=99999999&sort=desc', function (error, response, data) {
                if (!error && response.statusCode == 200) {
                    var _transactions = JSON.parse(data).result;
                    for (var i = 0; i <= _transactions.length - 1; i++) {
                        _transactions[i].wallet = walletSearched._id;
                        _transactions[i].user = req.user.sub;
                    }
                    Transaction.remove({ wallet: walletSearched._id }, (err) => {
                        if (err) {
                            c.danger('File : WalletController -> Function : getTransactions() -> Transaction.remove() -> ' + err.stack);
                            return res.status(406).send({ message: 'Error: can not connect to the database to insert transactions.' });
                        }
                        Transaction.insertMany(_transactions, (err, transactionsInserted) => {
                            if (err) {
                                c.danger('File : WalletController -> Function : getTransactions() -> Transaction.insertMany() -> ' + err.stack);
                                return res.status(406).send({ message: 'Error: can not connect to the database to insert transactions.' });
                            }

                            if (!transactionsInserted)
                                return res.status(406).send({ message: 'The transactions not exists.' });
                            return res.status(200).send({ transactions: transactionsInserted });
                        });
                    });

                } else {
                    return res.status(406).send({ message: 'Error get transactions' });
                }
            });
        });
    } catch (err) {
        c.danger('File : WalletController -> Function : getTransactions() -> ' + err.stack);
        return res.status(500).send({ message: 'Server Error' });
    }

}

function getTransaction(req, res) {
    try {
        var params = req.body;
        if (!(params && params.walletId && params.transactionId))
            return res.status(406).send({ message: 'Parameters are required' });

        Transaction.findOne({ user: req.user.sub, wallet: params.walletId, _id: params.transactionId }, (err, transactionSearched) => {
            if (err) {
                c.danger('File : WalletController -> Function : getTransaction() -> Transaction.findOne() -> ' + err.stack);
                return res.status(406).send({ message: 'Error: can not connect to the database to get transaction.' });
            }
            if (!transactionSearched)
                return res.status(406).send({ message: 'Error: Transaction not found.' });
            return res.status(200).send({ transaction: transactionSearched });
        }).populate({ path: 'wallet', select: { password: 0, privateKey: 0 } });
    } catch (err) {
        c.danger('File : WalletController -> Function : getTransaction() -> ' + err.stack);
        return res.status(500).send({ message: 'Server Error' });
    }
}

//export controller module
module.exports = {
    getWallets,
    getWallet,
    newWallet,
    restoreWalletFromPrivateKey,
    restoreWalletFromEncryptedWallet,
    restoreWalletFromMnemonic,
    removeWallet,
    getBalance,
    updateWalletName,
    getTransactions,
    getTransaction
};