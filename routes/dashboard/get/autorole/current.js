const express = require('express');
const axios = require('axios');

/**
 * @param {express.Request} req
 * @param {express.Response} res
*/
module.exports = async(req, res) => {
    const guild = req.query.guild;

    const autoRoleFolderReq = await axios.get(`https://bot.daalbot.xyz/get/database/readDir?skipread=true`, {
        headers: {
            'Authorization': process.env.BotCommunicationKey,
            'bot': 'Discord',
            'path': `/autorole/${guild}/`
        }
    });

    /**
     * @type {Array<{name: string, value: string}>}
     */
    const autoRoleFolder = autoRoleFolderReq.data;

    const autoRoles = autoRoleFolder.map(file => {
        return file.name.replace('.id', '');
    }) // Just a list of role IDs

    return res.status(200).send(autoRoles);
};