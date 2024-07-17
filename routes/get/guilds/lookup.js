const express = require('express');
const client = require('../../../client.js');

/**
 * @param {express.Request} req
 * @param {express.Response} res
*/
module.exports = (req, res) => {
    const guild = req.query.guild;

    res.send(client.guilds.cache.get(guild));
}

module.exports.restrictions = [
    'USER|a16f75c75427a6a1939fda73a18aaff0d1612c106a09a036c0b531091737dc39'
];

// Prevent file from being included in the documentation
module.exports.noSpec = true;