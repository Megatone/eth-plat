'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = Schema({    
    name: String,
    surname: String,
    email: String,
    password: String,
    role: String,
    phone: String,
    country: {
        name : String,
        code : String
    },
    address: String,
    registerDate: String,
    updateDate: String,
    lastLogin : String,
    totp : {
        secret : String ,
        active : Boolean
    }
});

module.exports = mongoose.model('User' , UserSchema);   