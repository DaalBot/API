const express = require('express');
const client = require('../../../client');

/**
 * @param {express.Request} req
 * @param {express.Response} res
*/
module.exports = (req, res) => {
    let guilds = [];

    client.guilds.cache.forEach(async guild => {
        const owner = await guild.fetchOwner();
        guilds.push({
            name: guild.name,
            id: guild.id,
            icon: guild.iconURL(),
            owner: guild.ownerId,
            ownerName: owner.user.username,
            memberCount: guild.memberCount
        });

        if (guilds.length === client.guilds.cache.size) {
            res.json(guilds);
        }
    });
};

module.exports.restrictions = [
    'USER|a16f75c75427a6a1939fda73a18aaff0d1612c106a09a036c0b531091737dc39'
];

// Prevent file from being included in the documentation
module.exports.noSpec = true;