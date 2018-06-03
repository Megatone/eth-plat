'use strict'
//load libs
var request = require('request');
var c = require('../utils/console/console');
const settings = require('../../config/settings');
const Web3 = require('web3');

//const web3 = new Web3('http://' + settings.geth.address + ':' + settings.geth.port);
const web3 = new Web3(settings.jsonRPCService.url);
const NodeInformation = require('../models/nodeInformation');

function getNodeInfo(req, res) {
    try {
        Promise.all([
            NodeInformation.findOne({}).exec()
        ]).then((nodeInformation) => {
            return res.status(200).send({
                users: nodeInformation[0].users,
                wallets: nodeInformation[0].wallets,
                transactions: nodeInformation[0].transactions,
                pendingBlocks: nodeInformation[0].pendingBlocks,
                percentProgress: nodeInformation[0].percentProgress,
                price_usd: nodeInformation[0].price_usd,
                price_btc: nodeInformation[0].price_btc
            });
        }).catch((err) => {
            c.danger('File : nodeController -> Function : getNodeInfo() -> ' + err.stack);
            return res.status(406).send({ message: 'Cannot connect to database' });
        });

    } catch (err) {
        c.danger('File : nodeController -> Function : getNodeInfo() -> ' + err.stack);
        return res.status(406).send({ message: 'Cannot connect to database' });
    }
}

function getPriceHistory(req, res) {
    try {
        var params = req.body;
        if (!params && !params.days)
            return res.status(406).send({ message: 'Params are required' });
        var url = (parseInt(params.days) === 1) ? 'https://min-api.cryptocompare.com/data/histohour?fsym=ETH&tsym=USD&limit=24&aggregate=1&e=Kraken' : 'https://min-api.cryptocompare.com/data/histoday?fsym=ETH&tsym=USD&limit=' + params.days + '&aggregate=1&e=Kraken';

        request(url, function (error, response, data) {
            if (!error && response.statusCode == 200) {
                var ethPrice = JSON.parse(data).Data;
                return res.status(200).send({ data: ethPrice });
            } else {
                return res.status(406).send({ message: 'Server Error' });
            }
        });
    } catch (err) {
        c.danger('File : Nodecontroller -> Function : getPriceHistory() -> ' + err.stack);
        return res.status(500).send({ message: 'Server Error' });
    }
}

function getEthInfo(req, res) {
    try {
        request('https://api.coinmarketcap.com/v1/ticker/ethereum/', function (error, response, data) {
            if (!error && response.statusCode == 200) {
                var ethInfo = JSON.parse(data)[0];
                return res.status(200).send({ ethInfo: ethInfo });
            } else {
                return res.status(406).send({ message: 'Error get Eth Info' });
            }
        });
    } catch (err) {
        c.danger('File : NodeController -> Function : getEthInfo() -> ' + err.stack);
        return res.status(500).send({ message: 'Server Error' });
    }
}

//export controller module
module.exports = {
    getNodeInfo,
    getPriceHistory,
    getEthInfo
};