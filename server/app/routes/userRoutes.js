'use strict'

var express = require('express');
var UserController = require('../controllers/userController');
var md_Auth = require('../middlewares/authenticatedMiddleware');
var TOTPController = require('../controllers/TOTPController');

var api = express.Router();

api.post('/register', UserController.register);

api.post('/login', UserController.login);

api.post('/login-two-factor', UserController.loginTwoFactor);

api.put('/update-profile', md_Auth.ensureAuth, UserController.updateUser);

api.post('/configure-2a', md_Auth.ensureAuth, TOTPController.configureTOTP);

api.post('/enable-2a', md_Auth.ensureAuth, TOTPController.enableTOTP);

api.post('/disable-2a', md_Auth.ensureAuth, TOTPController.disableTOTP);

module.exports = api;

