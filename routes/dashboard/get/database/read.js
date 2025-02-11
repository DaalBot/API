const express = require('express');
const axios = require('axios');
require('dotenv').config();
const tools = require('../../../../tools.js');

/**
 * @param {express.Request} req 
 * @param {express.Response} res 
*/
module.exports = async(req, res) => {
    const { guild, path } = req.query;

    if (!guild || !path) return res.status(400).json({ error: 'Missing "guild" or "path" query parameter' });
    if (path.match(/[^a-zA-Z0-9_\-\/.]/gmi) || path.includes('..')) return res.status(400).json({ error: 'Invalid "path" query parameter' });

    const data = await tools.readFile(`/managed/${guild}/${path}`);
    if (!data) return res.status(404).json({ error: 'File not found / File is empty' });

    res.send(`${data}`); // Force string as otherwise express may interpret numbers as status codes
}