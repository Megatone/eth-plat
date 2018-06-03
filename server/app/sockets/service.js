var express = require('express');
var expressIO = require('express');
var appIO = express();
var serverIO = require('http').Server(appIO);
var io = require('socket.io')(serverIO);
var settings = require('../../config/settings');
var c = require('../utils/console/console');

function initSocketService() {
    serverIO.listen(settings.sockets.port, function () {
        c.success("Socket IO Service Init Succesffully");
        c.info('Socket.IO Service Port "' + settings.sockets.port + '"');
    });
}

io.sockets.on('connection', function (socket) {
    c.warning("Client connect with socketId => " + socket.id);
});

function emitNodeInfo(nodeInfo) {
    io.sockets.emit("node-information", nodeInfo);
    c.warning('Emit node information to ' + io.engine.clientsCount + ' clients width socket connection');
}

module.exports = {
    initSocketService,
    emitNodeInfo
}