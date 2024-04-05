const client = require('./client.js');
const DJS = require('discord.js');
require('dotenv').config();

/**
 * @param {string} err 
 * @param {import('express').Request} req
 * @returns {void}
*/
function handleError(err, req) {
    console.error(err);

    if (err.includes('rate')) return; // Rate limit so not that bad

    // Now for the real shit
    const channel = process.env.HTTP ? client.channels.cache.get('1134511234734096476') : client.channels.cache.get('1003825386045575168');

    const embed = new DJS.EmbedBuilder()
        .setTitle(`DaalBot API Error`)
        .setFields(
            {
                name: 'Route',
                value: `${req.originalUrl}` || 'Unknown (check logs)',
                inline: true
            },
            {
                name: 'Happened at',
                value: `<t:${Math.ceil(Date.now() / 1000)}:f> (<t:${Math.ceil(Date.now() / 1000)}:R>)` || 'Unknown (use message timestamp)',
                inline: true
            },
            {
                name: 'HTTP Verb',
                value: `${req.method}` || 'Unknown',
                inline: true,
            },
            {
                name: 'Details',
                value: `\`\`\`\n${err}\n\`\`\`` || 'Unknown (check logs)',
                inline: false
            }
        )
        .setTimestamp()
        .setColor('Red');

    channel.send({
        content: `<@&${process.env.HTTP ? '1048375077659476050' : '1173214195605590097'}> DaalBotAPI Error`,
        embeds: [
            embed
        ]
    })
}

// Copied from line 451 of DaalBot/Discord daalbot.js
async function id_generatestring(length = 32) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;

    // Default settings: 2.08592483976E93 possible combinations [length ^ 62 (< charset length)]
    
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result.replace(/\B(?=(.{5})+(?!.))/g, '-');
}

module.exports = {
    handleError,
    id_generatestring
}