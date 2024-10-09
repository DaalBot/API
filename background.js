const pantry = require('pantry-node');
const client = require('./client');
const pantryId = process.env.PANTRY_ID;
const pantryClient = new pantry(pantryId);

/**
 * @type {number[]}
*/
let queue = []; // A queue to store message timestamps

client.on('messageCreate', async (message) => {
    queue.push(Date.now()); // Add the current time to the queue
})

setInterval(async () => {
    if (queue.length == 0) return; // No messages to push so we can skip everything

    try {
        // Get the current data from the pantry
        const currentData = await pantryClient.basket.get(`analytics${process.env.HTTP ? '-dev' : ''}`);
        const data = currentData;
        let messages = data.messages || [];

        // Add the queued messages to the messages array
        for (let i = 0; i < queue.length; i++) {
            messages.push(queue[i]);
        }

        // Get rid of messages older than 24 hours
        const now = Date.now();
        const oneDay = 1000 * 60 * 60 * 24;
        messages = messages.filter((message) => now - message < oneDay);
        
        messages = Array.from(new Set(messages)); // Remove duplicates

        await pantryClient.basket.create(`analytics${process.env.HTTP ? '-dev' : ''}`, { messages }); // Update the pantry with the new messages
        queue = []; // Clear the queue
    } catch (error) {
        if (error?.context?.includes('limited.')) return console.error('Rate limited - Pantry'); // Rate limited but its fine since we will just add it to the queue and push it later
        console.error(error);
    }
}, 1000 * 5);