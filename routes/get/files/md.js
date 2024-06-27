const express = require('express');
const axios = require('axios');

/**
 * @param {express.Request} req 
 * @param {express.Response} res 
*/
module.exports = async (req, res) => {
    const fileName = req.query.file;
    if (!fileName) {
        res.status(400).send('Bad Request');
        return;
    }

    try {
        const file = await axios.get(`http://bot.daalbot.xyz:8923/md/${fileName}`);

        res.status(200).send(file.data);
    } catch (e) {
        res.status(500).send('Failed to get file. Does it exist?')
    }
}