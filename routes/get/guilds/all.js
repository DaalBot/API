const express = require('express');
const client = require('../../../client');

/**
 * @param {express.Request} req
 * @param {express.Response} res
*/
module.exports = async (req, res) => {
    res.send(client.guilds.cache.map(async guild => {
        return {
            name: guild.name,
            id: guild.id,
            icon: guild.iconURL(),
            owner: guild.ownerId,
            ownerName: await guild.fetchOwner().then(owner => owner.user.username),
            memberCount: guild.memberCount
        }
    }));
};

module.exports.restrictions = [
    'USER|a16f75c75427a6a1939fda73a18aaff0d1612c106a09a036c0b531091737dc39'
];

// Prevent file from being included in the documentation
module.exports.noSpec = true;