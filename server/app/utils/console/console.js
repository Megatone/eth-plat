'use strict'
var colors = require('colors/safe');

var limit = 150;
var charSpance = '=';

function log(message, value = null, format = true) {
    console.log(colors.white(this.getDate()) + ' | ' + colors.white(message) + (value ? (format && format === true ? getFormatSpace(message, value) : '') + '=> ' + colors.white(value) : ''));
};

function success(message, value = 'OK', format = true) {
    console.log(colors.white(this.getDate()) + ' | ' + colors.green(message) + (value ? (format && format === true ? getFormatSpace(message, value) : '') + '=> ' + colors.green(value) : ''));
};

function info(message, value = 'INFO', format = true) {
    console.log(colors.white(this.getDate()) + ' | ' + colors.cyan(message) + (value ? (format && format === true ? getFormatSpace(message, value) : '') + '=> ' + colors.cyan(value) : ''));
};

function warning(message, value = 'WARNING', format = true) {
    console.log(colors.white(this.getDate()) + ' | ' + colors.yellow(message) + (value ? (format && format === true ? getFormatSpace(message, value) : '') + '=> ' + colors.yellow(value) : ''));
};

function danger(message, value = 'DANGER', format = true) {
    console.log(colors.white(this.getDate()) + ' | ' + colors.red(message) + (value ? (format && format === true ? getFormatSpace(message, value) : '') + '=> ' + colors.red(value) : ''));
};


function getDate() {
    var d = new Date();
    return d.toLocaleTimeString()
};

function getFormatSpace(message, value) {
    var totalLength = 11;
    if (message)
        totalLength += parseInt(message.length);   
    var txt = ' [';
    for (var i = 0; i < parseInt(limit - totalLength); i++) {
        txt += charSpance;
    }
    return txt;
};


module.exports = {
    log,
    success,
    info,
    warning,
    danger,
    getDate
};