'use strict'

//load libs
var c = require('../utils/console/console');

//load models
var Country = require('../models/countrie');

function getCountries(req, res) {
    Country.find({},{_id:0}).exec((err, countries) => {
        if (err) {
            c.danger('File : CountryController -> Function : getCountries() -> Country.find()');
            return res.status(406).send({ message: 'Error: can not connect to the database to get countries.' });
        }

        if (countries.length === 0)
            return res.status(200).send({ message: 'Not have Countries', wallets: [] });

        return res.status(200).send({ countries: countries });
    })
}


module.exports = {
    getCountries
}