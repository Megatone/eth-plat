'use strict'

var express = require('express');
var bodyParser = require('body-parser');
var app = express();

//cargar rutas
var user_routes = require('./routes/userRoutes');
var wallet_routes = require('./routes/walletRoutes');
var country_routes = require('./routes/countryRoutes');
var node_routes = require('./routes/nodeRoutes');

//configurar middleware de body parsers
// funciones que se ejecutan antes de que se ejecute la funcion solicitada por una peticion
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//configurar cabeceras y CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization , X-API-KEY , Origin , X-Requested-With , Content-Type , Accept , Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST , OPTIONS , PUT , DELETE');
    res.header('Allow', 'GET , POST ,OPTIONS , PUT ,DELETE ');
    next();
});

//configurar rutas base
app.use('/api', user_routes);
app.use('/api', wallet_routes);
app.use('/api', country_routes);
app.use('/api', node_routes);

//exportar el modulo
module.exports = app;