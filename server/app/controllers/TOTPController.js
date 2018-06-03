'use strict'
var speakeasy = require("speakeasy");
var User = require('../models/user');
var bcrypt = require('bcrypt-nodejs');
var validator = require('../utils/validate/validate');
var c = require('../utils/console/console');
const TOTP_ISSUE = 'Ethereum Wallet 2A';

function configureTOTP(req, res) {
    var params = req.body;
    if (!(params && params.password))
        return res.status(406).send({ message: 'Password is required.' });

    User.findOne({ _id: req.user.sub }, (err, user) => {
        if (err) {
            c.danger('File : TOTPController -> Function : configureTOTP() -> User.findOne() -> ' + err.stack);
            return res.status(406).send({ message: 'Error: can not connect to the database to configure two factor authentication.' });
        }
        bcrypt.compare(params.password, user.password, (err, check) => {
            if (err) {
                c.danger('File : TOTPController -> Function : configureTOTP() -> bcrypt.compare() -> ' + err.stack);
                return res.status(406).send({ message: 'Error: can not compare encrypted passwords.' });
            }
            if (!check)
                return res.status(406).send({ message: 'The password is not correct' });

            let secret = speakeasy.generateSecret({
                name: `${TOTP_ISSUE} : ${user.email}`
            });
            user.totp.secret = secret.base32;
            User.findByIdAndUpdate(user._id, { "totp.secret": user.totp.secret }, { new: true }, (err, userUpdate) => {
                if (err) {
                    c.danger('File : TOTPController -> Function : configureTOTP() -> bcrypt.findByIdAndUpdate() -> ' + err.stack);
                    return res.status(406).send({ message: 'Error: can not connect to the database to configure two factor authentication.' });
                }
                if (userUpdate)
                    return res.status(200).send({
                        qr_code: 'http://chart.apis.google.com/chart?chs=166x166&chld=L|0&cht=qr&chl=' + secret.otpauth_url,
                        message: 'Secret generated succesfully'
                    });
            });
        });

    });

}

function enableTOTP(req, res) {
    var params = req.body;
    if (!(params && params.code))
        return res.status(406).send({ message: 'Pin code is required.' });

    User.findOne({ _id: req.user.sub }, (err, user) => {
        if (err) {
            c.danger('File : TOTPController -> Function : enableTOTP() -> User.findOne() -> ' + err.stack);
            return res.status(406).send({ message: 'Error: can not connect to the database to enable two factor.' });
        }
        if (!user)
            return res.status(406).send({ message: 'Error: can not connect to the database to enable two factor.' });

        let result = speakeasy.totp.verify({
            secret: user.totp.secret,
            encoding: 'base32',
            token: params.code,
            window: 3
        });
        User.findByIdAndUpdate(user._id, { "totp.active": result }, { new: true }, (err, userUpdate) => {
            if (err) {
                c.danger('File : TOTPController -> Function : enableTOTP() -> bcrypt.findByIdAndUpdate() -> ' + err.stack);
                return res.status(406).send({ message: 'Error: can not connect to the database to enable two factor.' });
            }
            if (userUpdate)
                return res.status(200).send({ result, message: (result === true) ? 'Two factor enabled successfully' : 'Pin code not valid' });
            return res.status(406).send({ message: 'Error: can not connect to the database to enable two factor.' });
        });
    });
};

function disableTOTP(req, res) {

    var params = req.body;
    if (!(params && params.password))
        return res.status(406).send({ message: 'Password is required.' });

    User.findOne({ _id: req.user.sub }, (err, user) => {
        if (err) {
            c.danger('File : TOTPController -> Function : disableTOTP() -> User.findOne() -> ' + err.stack);
            return res.status(406).send({ message: 'Error: can not connect to disable two factor authentication.' });
        }
        bcrypt.compare(params.password, user.password, (err, check) => {
            if (err) {
                c.danger('File : TOTPController -> Function : disableTOTP() -> bcrypt.compare() -> ' + err.stack);
                return res.status(406).send({ message: 'Error: can not compare encrypted passwords.' });
            }
            if (!check)
                return res.status(406).send({ message: 'The password is not correct' });

            User.findByIdAndUpdate(user._id, { totp: { secret: '', active: false } }, { new: true }, (err, userUpdate) => {
                if (err) {
                    c.danger('File : TOTPController -> Function : disableTOTP() -> bcrypt.findByIdAndUpdate() -> ' + err.stack);
                    return res.status(406).send({ message: 'Error: can not connect to database to disable two factor authentication.' });
                }
                if (userUpdate)
                    return res.status(200).send({ result: userUpdate.totp.active  , message : 'Two factor authentication disabled successfully.'});
                return res.status(200).send({ result: true  , message : 'Two factor authentication not disabled'});
            });
        });

    });





}






module.exports = {
    configureTOTP,
    enableTOTP,
    disableTOTP
}