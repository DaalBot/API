const fsp = require('fs').promises;

module.exports = async(req, res) => {
    const data = await fsp.readFile(`./data/activity/${req.query.guild}.json`, 'utf-8');
    res.json(JSON.parse(data));
}