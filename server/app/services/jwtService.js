'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret = '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';

exports.createToken = function (user, isTwoFactorPassed) {
    var payload = {
        sub: user._id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        role: user.role,
        phone: user.phone,
        country: user.country,
        address: user.address,
        registerDate: user.registerDate,
        updateDate: user.updateDate,
        lastLogin: user.lastLogin,
        totp: {
            active: user.totp.active
        },
        twoFactorPassed: isTwoFactorPassed,
        iat: moment().unix(),
        exp: moment().add(30, 'days').unix()
    };
    return jwt.encode(payload, secret, 'HS512');
};
