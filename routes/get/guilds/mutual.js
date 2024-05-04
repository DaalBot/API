const express = require('express');
const client = require('../../../client');
const axios = require('axios');

let cache = {};

/**
 * @param {express.Request} req
 * @param {express.Response} res
*/
module.exports = async (req, res) => {
    const accessCode = req.headers.authorization;

    if (cache[accessCode]) {
        return res.json(cache[accessCode])
    };

    // Get the guilds the user is in
    const guilds = await axios.get('https://discord.com/api/users/@me/guilds', {
        headers: {
            authorization: `Bearer ${accessCode}`
        }
    });

    /**
     * @type {Array<string>}
    */
    const mutualGuilds = [];

    for (let i = 0; i < guilds.data.length; i++) {
        const guild = guilds.data[i];
        if (client.guilds.cache.has(guild.id)) {
            mutualGuilds.push(guild.id);
        }
    }

    cache[accessCode] = mutualGuilds;

    res.json(mutualGuilds);
};

module.exports.restrictions = [
    'KEY|Dashboard'
];