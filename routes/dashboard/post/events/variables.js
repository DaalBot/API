const express = require('express');
const { readFile, writeFile } = require('../../../../tools.js');

/**
 * @param {express.Request} req
 * @param {express.Response} res
*/
module.exports = async (req, res) => {
    const { scope, name } = req.query;
    if (!scope) return res.status(400).send({ error: 'No scope provided' });
    if (!name) return res.status(400).send({ error: 'No name provided' });

    if (scope != 'global') {
        /**
         * @type {{ id: string, name: string, description: string, guild: string, enabled: boolean, on: string }[]}
        */
        const eventJson = await readFile(`/events/events.json`);
        const foundEvent = eventJson.find(event => event.id == scope);
        if (!foundEvent) return res.status(404).send({ error: 'Event not found' });
        if (foundEvent.guild != req.query.guild) return res.status(403).send({ error: 'You do not have permission to modify this event.' });
    }

    const path = `/events/${scope == 'global' ? req.query.guild : scope}/${name}.var`;

    await writeFile(path, req.body.data);

    res.status(200).send({
        success: 'Variable written successfully'
    });
}