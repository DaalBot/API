const pantry = require('pantry-node');
const pantryId = process.env.PANTRY_ID;
const pantryClient = new pantry(pantryId);
const client = require('../../../client.js');

let cachedOutput = {
    addedAt: -1,
    data: {
        resType: 'no-data',
        message_counts: {
            'day': 0,
        },
    }
}

module.exports = async(req, res) => {
    if (cachedOutput.addedAt + 1000 *  5 > Date.now())
        return res.json({
            ...cachedOutput.data,
            resType: 'cached'
        });

    try {
        const currentData = await pantryClient.basket.get(`analytics${process.env.HTTP ? '-dev' : ''}`);
        const data = currentData;
        let messages = data.messages || [];

        const now = Date.now();
        const oneDay = 1000 * 60 * 60 * 24;
        messages = messages.filter((message) => now - message < oneDay);
        messages = Array.from(new Set(messages));

        const dayMessages = messages.filter((message) => now - message < oneDay);

        const history = data.history || {};
        let monthTotal = 0;

        for (let i = 0; i < 30; i++) {
            const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) - i;
            
            if (history[daysSinceEpoch]) monthTotal += history[daysSinceEpoch];
            else break;
        }

        cachedOutput = {
            addedAt: Date.now(),
            data: {
                message_counts: {
                    'month': monthTotal ?? 0,
                    'day': dayMessages.length ?? 0,
                    'lifetime': data.totalMessages ?? 0
                },
                bot: {
                    user_count: client.users.cache.size ?? -1,
                    channel_count: client.channels.cache.size ?? -1,
                    guild_count: client.guilds.cache.size ?? -1,
                },
                resType: 'fresh'
            }
        }

        res.json(cachedOutput.data);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching the data' });
    }
}