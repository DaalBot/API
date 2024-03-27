const express = require('express');

/**
 * @param {express.Request} req
 * @param {express.Response} res
*/

module.exports = (req, res) => {
    res.status(200).json({
        message: 'OK',
        code: 200,
    });
};