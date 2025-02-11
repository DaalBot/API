const express = require('express');
const axios = require('axios');
require('dotenv').config();
const tools = require('../../../../tools.js');

/**
 * @param {express.Request} req
 * @param {express.Response} res
*/
module.exports = async(req, res) => {
    const {
        guild
    } = req.query;

    const {
        path,
        data
    } = req.body;

    if (!path || !data) return res.status(400).json({
        error: 'Missing path or data in request body'
    });

    if (path.match(/[^a-zA-Z0-9_\-\/.]/gmi) || path.includes('..')) return res.status(400).json({
        error: 'Invalid path'
    });

    await tools.writeFile(`/managed/${guild}/${path}`, data);

    res.json({
        success: true
    })
}