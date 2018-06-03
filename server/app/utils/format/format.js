'use strict'

const MIN_LEGTH_PRIVATE_KEY = 64;
const PREFIX_PRIVATE_KEY = '0x';

function formatPrivateKey(privateKey){
    return (privateKey.length === MIN_LEGTH_PRIVATE_KEY) ? PREFIX_PRIVATE_KEY + privateKey : privateKey;     
}

module.exports = {
    formatPrivateKey
}