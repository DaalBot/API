const express = require('express');
const axios = require('axios');

/**
 * @param {express.Request} req
 * @param {express.Response} res
*/
module.exports = async(req, res) => {
    const body = req.body;
    if (!body) return res.status(400).send(`<h1>400 Bad Request (body missing)</h1>`);

    const response = await axios.post('http://api.daalbot.xyz:8564', body, {
        headers: {
            'Content-Type': 'application/json'
        }
    })

    if (response.status !== 200) return res.status(500).send(`<h1>500 Internal Server Error (microservice failed)</h1>`);
    res.header('Content-Type', 'text/html');
    res.header('Access-Control-Allow-Origin', '*'); // WHO TF INVENTED CORS I WANNA TALK TO THEM
    res.send(response.data);
}