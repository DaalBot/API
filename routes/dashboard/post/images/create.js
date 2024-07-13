// This file shouldnt even be required but vercel has request length limits so its onto api.daalbot.xyz where i have full control
const express = require('express');
const axios = require('axios');

/**
 * @param {express.Request} req
 * @param {express.Response} res
*/
module.exports = async (req, res) => {
    const image = req.query.image; // Base64 image string
    if (!image) return res.status(400).send('No image provided');

    const form = new FormData();
    form.append("image", image.split(';base64,').pop());

    const options = {
        method: 'POST',
        url: `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_KEY}`,
        headers: {'content-type': 'multipart/form-data; boundary=---011000010111000001101001'},
        data: form,
    };

    try {
        const response = await axios.request(options);

        res.json(response.data);
    } catch (error) {
        console.error(error.response);

        res.status(500).send('An error occurred');
    }
}