const express = require('express');
const client = require('../../../client.js');

/**
 * @param {express.Request} req
 * @param {express.Response} res
*/
module.exports = (req, res) => {
    const guild = req.query.guild;

    const guildObj = client.guilds.cache.get(guild);

    guildObj.fetchOwner().then(owner => {
        res.json({
            name: guildObj.name,
            id: guildObj.id,
            roles: guildObj.roles.cache.map(role => role.id),
            owner: guildObj.ownerId,
            ownerName: owner.user.username,
            ownerAvatar: owner.user.displayAvatarURL(),
            memberCount: guildObj.memberCount,
            icon: guildObj.iconURL(),
            channels: guildObj.channels.cache.map(channel => {
                return {
                    id: channel.id,
                    name: channel.name,
                    type: channel.type,
                    parent: channel.parent ? channel.parent.id : null
                }
            }),
            emojis: guildObj.emojis.cache.map(emoji => {
                return {
                    id: emoji.id,
                    name: emoji.name,
                    url: emoji.url
                }
            }),
        })
    })
}

module.exports.restrictions = [
    'USER|a16f75c75427a6a1939fda73a18aaff0d1612c106a09a036c0b531091737dc39'
];

// Prevent file from being included in the documentation
module.exports.noSpec = true;