// This file shouldnt even be required but vercel has request length limits so its onto api.daalbot.xyz where i have full control
const express = require('express');
const axios = require('axios');
const formidable = require('formidable');

/**
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
*/
module.exports = (req, res, next) => {
    const form = new formidable.IncomingForm({
        maxFiles: 1,
        maxFileSize: 32 * 1024 * 1024, // 32MB (IMGBB limit)
    })

    form.parse(req, (err, fields, files) => {
        if (err) {
            next(err);
            return;
        }
        res.json({fields, files});
    })
}