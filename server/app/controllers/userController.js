'use strict'
//load libs
var bcrypt = require('bcrypt-nodejs');
var validator = require('../utils/validate/validate');
var c = require('../utils/console/console');
var speakeasy = require("speakeasy");
//load models
var User = require('../models/user');

//load services
var jwt = require('../services/jwtService');

//actions
function register(req, res) {
    try {
        var user = new User();
        var params = req.body.user;

        if (!(params && params.name && params.surname && params.email && params.password && params.phone && params.country && params.address))
            return res.status(406).send({ message: 'All fields are required.' });

        if (!validator.validateEmail(params.email))
            return res.status(406).send({ message: 'Email field is not valid.' });


        //Check email exists in databse
        User.findOne({ email: params.email.toLowerCase() }, (err, issetUser) => {
            if (err) {
                c.danger('File : UserController -> Function : register() -> User.findOne() -> ' + err.stack);
                return res.status(406).send({ message: 'Error: can not connect to the database to check email exists' });
            }
            if (issetUser && issetUser.email === params.email)
                return res.status(406).send({ message: 'The user can not register because a similar email address already exists in the database.' });

            // encrypt password
            bcrypt.hash(params.password, null, null, function (err, hash) {
                if (err) {
                    c.danger('File : UserController -> Function : register() -> bcrypt.hash() -> ' + err.stack);
                    return res.status(406).send({ message: 'Error: can not encrypt the password' });
                }

                user.password = hash;
                user.name = params.name;    
                user.surname = params.surname;
                user.email = params.email;
                user.phone = params.phone;
                user.country = params.country;
                user.address = params.address;
                user.role = 'ROLE_USER';
                user.registerDate = Math.floor(Date.now() / 1000);
                user.updateDate = Math.floor(Date.now() / 1000);
                user.lastLogin = 0;

                user.save((err, userStored) => {
                    if (err) {
                        c.danger('File : UserController -> Function : register() -> user.save() -> ' + err.stack);
                        return res.status(406).send({ message: 'Error: can not connect to the database to save user' });
                    }

                    if (!userStored)
                        return res.status(406).send({ message: 'The user has not registered' });

                    return res.status(200).send({
                        user: userStored,
                        message: 'User registered successfully'
                    });
                });
            });
        });
    } catch (err) {
        c.danger('File : UserController -> Function : register() -> ' + err.stack);
        return res.status(500).send({ message: 'Server Error' });
    }
};

function login(req, res) {
    try {
        var params = req.body;
        if (!(params && params.email && params.password))
            return res.status(406).send({ message: 'All fields are required.' });

        if (!validator.validateEmail(params.email))
            return res.status(406).send({ message: 'Email field is not valid.' });

        User.findOne({ email: params.email }, (err, user) => {
            if (err) {
                c.danger('File : UserController -> Function : login() -> User.findOne() -> ' + err.stack);
                return res.status(406).send({ message: 'Error: can not connect to the database to login user.' });
            }
            if (!user || user.email !== params.email)
                return res.status(406).send({ message: 'The email does not exist in the database' });

            bcrypt.compare(params.password, user.password, (err, check) => {
                if (err) {
                    c.danger('File : UserController -> Function : login() -> bcrypt.compare() -> ' + err.stack);
                    return res.status(406).send({ message: 'Error: can not compare encrypted passwords.' });
                }
                if (!check)
                    return res.status(406).send({ message: 'The password is not correct' });

                user.lastLogin = Math.floor(Date.now() / 1000);

                User.findByIdAndUpdate(user._id, { lastLogin: user.lastLogin }, { new: true }, (err, userUpdate) => {
                    if (err) {
                        c.danger('File : UserController -> Function : login() -> bcrypt.findByIdAndUpdate() -> ' + err.stack);
                        return res.status(406).send({ message: 'Error: can not update lastLogin date.' });
                    }
                    if (!userUpdate)
                        return res.status(406).send({ message: 'The user could not be updated' });

                    if (userUpdate.totp.active) {
                        res.status(200).send({
                            message: 'Login Success , please verify two factor',
                            needVerifyTwoFactor: true
                        });
                    } else {
                        userUpdate.password = undefined;
                        userUpdate.totp.secret = undefined;
                        return res.status(200).send({
                            user: userUpdate,
                            token: jwt.createToken(userUpdate, true),
                            message: 'Login Success',
                            needVerifyTwoFactor: false
                        });
                    }
                });
            });
        });
    } catch (err) {
        c.danger('File : UserController -> Function : login() -> ' + err.stack);
        return res.status(500).send({ message: 'Server Error' });
    }
};

function loginTwoFactor(req, res) {
    try {
        var params = req.body;
        if (!(params && params.email && params.password && params.code))
            return res.status(406).send({ message: 'All fields are required.' });

        if (!validator.validateEmail(params.email))
            return res.status(406).send({ message: 'Email field is not valid.' });

        User.findOne({ email: params.email }, (err, user) => {
            if (err) {
                c.danger('File : UserController -> Function : login() -> User.findOne() -> ' + err.stack);
                return res.status(406).send({ message: 'Error: can not connect to the database to login user.' });
            }
            if (!user || user.email !== params.email)
                return res.status(406).send({ message: 'The email does not exist in the database' });

            bcrypt.compare(params.password, user.password, (err, check) => {
                if (err) {
                    c.danger('File : UserController -> Function : login() -> bcrypt.compare() -> ' + err.stack);
                    return res.status(406).send({ message: 'Error: can not compare encrypted passwords.' });
                }
                if (!check)
                    return res.status(406).send({ message: 'The password is not correct' });

                let result = speakeasy.totp.verify({
                    secret: user.totp.secret,
                    encoding: 'base32',
                    token: params.code,
                    window: 3
                });

                if (result === false)
                    return res.status(406).send({ message: 'The pin code is not valid' });


                user.lastLogin = Math.floor(Date.now() / 1000);

                User.findByIdAndUpdate(user._id, { lastLogin: user.lastLogin }, { new: true }, (err, userUpdate) => {
                    if (err) {
                        c.danger('File : UserController -> Function : login() -> bcrypt.findByIdAndUpdate() -> ' + err.stack);
                        return res.status(406).send({ message: 'Error: can not update lastLogin date.' });
                    }
                    if (!userUpdate)
                        return res.status(406).send({ message: 'The user could not be updated' });

                    userUpdate.password = undefined;
                    userUpdate.totp.secret = undefined;
                    return res.status(200).send({
                        user: userUpdate,
                        token: jwt.createToken(userUpdate, true),
                        message: 'Login Success',
                        needVerifyTwoFactor: false
                    });

                });
            });
        });
    } catch (err) {
        c.danger('File : UserController -> Function : login() -> ' + err.stack);
        return res.status(500).send({ message: 'Server Error' });
    }
};

function updateUser(req, res) {
    try {
        var update = req.body.user;
        delete update.password;
        delete update.totp;

        if (!update)
            return res.status(406).send({ message: 'Parameters are required.' });

        if (!(update.name && update.surname && update.email && update.phone && update.country && update.address))
            return res.status(406).send({ message: 'All fields are required.' });

        //check email exists in other user
        User.findOne({ email: update.email, _id: { $ne: req.user.sub } }, (err, user) => {
            if (err) {
                c.danger('File : UserController -> Function : updateUser() -> User.findOne() -> ' + err.stack);
                return res.status(406).send({ message: 'Error: can not connect to the database to check email duplicate' });
            }
            if (user && user.email === update.email)
                return res.status(406).send({ message: 'The user can not update because a similar email address already exists in the database.' });

            //update last login
            update.updateDate = Math.floor(Date.now() / 1000);
            User.findByIdAndUpdate(req.user.sub, update, { new: true }, (err, userUpdate) => {
                if (err) {
                    c.danger('File : UserController -> Function : updateUser() -> User.findByIdAndUpdate() -> ' + err.stack);
                    return res.status(406).send({ message: 'Error: can not connect to the database to update user' });
                }
                if (!userUpdate)
                    return res.status(406).send({ message: 'The user could not be updated' });

                userUpdate.password = undefined;
                userUpdate.totp.secret = undefined;
                return res.status(200).send({
                    user: userUpdate,
                    token: jwt.createToken(userUpdate, true),
                    message : 'Profile updated successfully'
                });
            });
        });
    } catch (err) {
        c.danger('File : UserController -> Function : updateUser() -> ' + err.stack);
        return res.status(500).send({ message: 'Server Error' });
    }
};

//export controller module
module.exports = {
    register,
    login,
    loginTwoFactor,
    updateUser
};