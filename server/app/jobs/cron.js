'use strict'

const cron = require('node-cron');
var request = require('request');
const settings = require('../../config/settings');
const c = require('../utils/console/console');
const User = require('../models/user');
const Wallet = require('../models/wallet');
const Transaction = require('../models/transaction');
const NodeInformation = require('../models/nodeInformation');
const Price = require('../models/price');
const Web3 = require('web3');
const web3 = new Web3(settings.jsonRPCService.url);
var jobsInitiated = false;
var socketService = require('../sockets/service');

function initJob() {
    var init = cron.schedule('* * * * * *', () => {
        web3.eth.net.isListening((err, isListening) => {
            if (isListening && !jobsInitiated) {
                job10Sec.start();
                job10Min.start();
                job1Sec.start();
                c.success('Init cron jobs success');
                jobsInitiated = true;
                init.stop();
            }
        });
    });
}

var job10Sec = cron.schedule('*/10 * * * * *', () => {
    updateAccountStats();
    updateEthPrice();
}, false);

var job10Min = cron.schedule('*/10 * * * *', () => {
    updatePriceHistory();
}, false);

var job1Sec = cron.schedule('* * * * * * *', () => {
    updateNodeProcess();
    emitNodeInfo();
}, false);

function roundDate(d) {
    return (parseInt(d.getTime() / 3600000) * 3600000);
}

function getDateDifHours(now, last) {
    return parseInt((roundDate(now) - roundDate(last)) / 3600000);
}

function updateNodeInformation(nodeInformation) {
    NodeInformation.update({}, { $set: nodeInformation }, { upsert: true }, (err) => {
        if (err)
            c.danger('File : cron -> Function : updateNodeInformation() -> ' + err.stack);
    });
}

function updateEthPrice() {
    try {
        request('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD,BTC', function (error, response, data) {
            if (!error && response.statusCode == 200) {
                var ethInfo = JSON.parse(data);
                updateNodeInformation({ price_usd: ethInfo.USD, price_btc: ethInfo.BTC });
                c.info('JOB => Update Node Information => Eth Price => USD:' + ethInfo.USD + ' BTC:' + ethInfo.BTC);
            }
        });
    } catch (err) {
        c.danger('File : cron -> Function : getEthInfo() -> ' + err.stack);
    }
}

function updateAccountStats() {
    try {
        Promise.all([
            User.count().exec(),
            Wallet.count({ down: false }).exec(),
            Transaction.count().exec()
        ]).then((counts) => {
            updateNodeInformation({ users: counts[0], wallets: counts[1], transactions: counts[2] });
            c.info('JOB => Update Node Information => Accounts Stats => Users:' + counts[0] + ' Wallets:' + counts[1] + ' Transactions:' + counts[2]);
        });

    } catch (err) {
        c.danger('File : cron -> Function : updateInfo() -> ' + err.stack);
    }
}

function updatePriceHistory() {
    try {
        Promise.all([
            Price.findOne().sort({ time: -1 }).limit(1)
        ]).then(function (lastPriceRegistered) {
            var dif = getDateDifHours(new Date(), lastPriceRegistered[0].time);
            if (dif > 0) {
                var url = 'https://min-api.cryptocompare.com/data/histohour?fsym=ETH&tsym=USD&limit=' + dif + '&aggregate=1';
                request(url, function (error, response, data) {
                    if (!error && response.statusCode == 200) {
                        var prices = JSON.parse(data).Data;
                        if (prices.length > 1) {
                            if (prices[0].time * 1000 === roundDate(lastPriceRegistered[0].time)) {
                                prices.shift();
                                for (var i = 0; i <= prices.length - 1; i++) {
                                    prices[i] = { time: prices[i].time * 1000, usd: prices[i].close };
                                }
                                Price.insertMany(prices);
                                c.info('JOB => Isert Price History =>' + JSON.stringify(prices));
                            }
                        }
                    }
                });
            }
        });
    } catch (err) {
        c.danger('File : cron -> Function : updateInfo() -> ' + err.stack);
    }
}

function updateNodeProcess() {
    try {
        web3.eth.isSyncing((err, sync) => {
            if (err)
                c.danger('File : cron -> Function : nodeProgressUpdate() -> ' + err.stack);
            var pendingBlocks = 0;
            var percentProgress = 100;

            if (sync && sync !== true) {
                var max = sync.highestBlock - sync.startingBlock;
                var current = sync.currentBlock - sync.startingBlock;
                if (max !== 1) {
                    pendingBlocks = max - current;
                    percentProgress = (current / max) * 100;                 
                }
            }else if(sync ===true){
                web3.reset(true);
            }
            updateNodeInformation({ pendingBlocks, percentProgress });
            c.info('JOB => Update Node Information => Node Progress => PendingBlocks:' + pendingBlocks + ' Percent:' + percentProgress);
        });
    } catch (err) {
        c.danger('File : cron -> Function : nodeProgressUpdate() -> ' + err.stack);
    }
}

function emitNodeInfo() {
     try {
        NodeInformation.findOne({}, (err, nodeInformation) => {
            if (err)
                c.danger('File : cron -> Function : emitNodeInfo() -> ' + err.stack);
            if (!nodeInformation && !err)
                //c.danger('File : cron -> Function : emitNodeInfo() -> ' + err.stack);
            socketService.emitNodeInfo(nodeInformation);
        })
    } catch (err) {
        c.danger('File : cron -> Function : emitNodeInfo() -> ' + err.stack);
    } 
}

module.exports = {
    initJob
}