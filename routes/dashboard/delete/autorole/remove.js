const express = require('express');
const axios = require('axios');

/**
 * @param {express.Request} req
 * @param {express.Response} res
*/
module.exports = async(req, res) => {
    const guild = req.query.guild;
    const role = req.query.role;

    if (!role) return res.status(400).send({
        error: 'Role ID is required'
    });

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

    if (!autoRoles.includes(role)) {
        return res.status(400).send({
            error: 'Role isnt added yet'
        });
    }

    await axios.delete(`https://bot.daalbot.xyz/delete/database/remove`, {
        headers: {
            'Authorization': process.env.BotCommunicationKey,
            'bot': 'Discord',
            'path': `/autorole/${guild}/${role}.id`,
            'type': 'file'
        }
    });

    res.status(200).send({
        success: 'Role removed successfully'
    });
};