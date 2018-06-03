'use strict'

const MAX_LEGTH_PRIVATE_KEY = 66;
const MIN_LEGTH_PRIVATE_KEY = 64;
const PREFIX_PRIVATE_KEY = '0x';

function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function validatePrivateKey(privateKey) {
    return (privateKey && ((privateKey.length === MAX_LEGTH_PRIVATE_KEY && privateKey.substring(0, 2) === PREFIX_PRIVATE_KEY) || (privateKey.length === MIN_LEGTH_PRIVATE_KEY && privateKey.substring(0, 2) !== PREFIX_PRIVATE_KEY)))
}

module.exports = {
    validateEmail,
    validatePrivateKey
};