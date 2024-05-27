const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 3000;
const fs = require('fs');
let https;
const client = require('./client.js');
const axios = require('axios');
const crypto = require('crypto');

/**
 * @param {string} message
*/
async function debug(message) {
    if (process.env.HTTP) console.log(`[DEBUG] ${message}`)
}

/**
 * @typedef {Object} CachedDashUser
 * @property {string} accesscode - The user's access code.
 * @property {Object[]} guilds - The guilds the user has access to.
 * @property {string} guilds.id - The ID of the guild.
 * @property {number} guilds.permissions - The permissions the user has for the guild.
 * @property {number} cachedTimestamp - The timestamp of when the user was cached. Used for cache invalidation.
*/

/**
 * @type {CachedDashUser[]}
 */
let dashboardUsers = [];

if (process.env.HTTP == 'true') {
  https = require('http');
} else {
  https = require('https');
}

app.use(cors());

app.get('/', (req, res) => {
  res.redirect('https://github.com/DaalBot/API');
});

async function checkRequirements(req, res, file) {
    // Check if the route has restrictions
    if (require(`${file}`).restrictions) {
        const restrictions = require(`${file}`).restrictions;

        if (restrictions.length > 0) {
            let authorized = false;
            
            for (let i = 0; i < restrictions.length; i++) {
                let restriction = restrictions[i].split('|');
                let type = restriction[0];
                let value = restriction[1];

                if (type == 'USER') {
                    // Get user's ID
                    const accessCode = req.headers.authorization;

                    const res = await axios.get('https://discord.com/api/users/@me', {
                        headers: {
                            Authorization: `Bearer ${accessCode}`
                        }
                    });

                    const user = res.data;
                    const hashedId = crypto.createHash('sha256').update(user.id).digest('hex');

                    debug(`User ID: ${user.id} | Hashed ID: ${hashedId} | Target Hash: ${value}`)

                    if (hashedId == value) {
                        authorized = true;
                        break;
                    }
                } else if (type == 'KEY') {
                    switch (value) {
                        case 'Dashboard':
                            const accessCode = req.headers.authorization;
                            const hashedToken = crypto.createHash('sha256').update(accessCode).digest('hex');
                            const hashedTokens = fs.readFileSync('./data/auth.txt', 'utf-8').split('\n').map(tokenAndID => tokenAndID.split(':')[1]);

                            if (hashedTokens.includes(hashedToken)) {
                                authorized = true;
                            }
                            break;
                    }
                }
            }

            if (!authorized)
                res.status(401).send('Unauthorized');

            return authorized;
        }
    } else {
        return true;
    }
}

/**
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns {Promise<boolean>}
*/
async function checkDashAuth(req, res) {
    try {
        if (!req.headers.authorization) {
            res.status(401).send({
                error: 'Unauthorized - Missing Authorization Header'
            });
            return false;
        }

        if (!req.query.guild) {
            res.status(400).send({
                error: 'Bad Request - Missing guild query parameter'
            });
            return false;
        }

        const HashedToken = crypto.createHash('sha256').update(req.headers.authorization).digest('hex');
        const cachedUser = dashboardUsers.find(user => user.accesscode === req.headers.authorization);

        if (cachedUser && Date.now() - cachedUser.cachedTimestamp <= 15 * 60 * 1000) {
            // Use cached user data
            const guilds = cachedUser.guilds;
            const manageableGuilds = guilds.filter(guild => guild.permissions & 0x20);
            if (manageableGuilds.filter(guild => guild.id == req.query.guild).length != 0) {
                // User has permission to manage this guild
                return true;
            } else {
                return false;
            }
        }

        const hashedTokensAndIDs = fs.readFileSync('./data/auth.txt', 'utf-8').split('\n');
        const hashedTokens = hashedTokensAndIDs.map(tokenAndID => tokenAndID.split(':')[1]);

        if (!hashedTokens.includes(HashedToken) && !process.env.HTTP) {
            res.status(401).send('Unauthorized - Token not from trusted source');
            return false;
        };

        const guildsReq = await axios.get(`https://discord.com/api/users/@me/guilds`, {
            headers: {
                Authorization: `Bearer ${req.headers.authorization}`
            }
        })
    
        const guilds = guildsReq.data;

        // Cache the user
        dashboardUsers.push({
            accesscode: req.headers.authorization,
            guilds: guilds,
            cachedTimestamp: Date.now()
        });

        /**
         * @type {string[]}
         */
        const manageableGuilds = guilds.filter(guild => guild.permissions & 0x20).map(guild => guild.id);
    
        if (manageableGuilds.includes(req.query.guild)) {
            // User has permission to manage this guild
            return true;
        } else {
            res.status(403).send('Unauthorized - User does not have permission to manage this guild');
            return false;
        }
    } catch (error) {
        error = `${error}`;
        if (error.includes('401')) {
            res.status(401).send('Unauthorized - Invalid Token');
        } else if (error.includes('429')) {
            res.status(429).send('Too Many Requests - Discord API');
        } else {
            res.status(500).send('Internal Server Error');
        }

        return false; // If an error occurs, assume the user is not authorized
    }
}

app.get('/dashboard/:category/:action', async (req, res) => {
    const isAuthorized = await checkDashAuth(req, res);
    if (!isAuthorized) {
        return;
    }

    const category = req.params.category;
    const action = req.params.action;

    try {
        const route = require(`./routes/dashboard/get/${category}/${action}.js`);
        await route(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/dashboard/:category/:action', async(req, res) => {
    const isAuthorized = await checkDashAuth(req, res);
    if (!isAuthorized) {
        return;
    }

    const category = req.params.category;
    const action = req.params.action;

    try {
        const route = require(`./routes/dashboard/post/${category}/${action}.js`);
        route(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.delete('/dashboard/:category/:action', async(req, res) => {
    if (!(await checkDashAuth(req, res))) return;
    // User has permission to manage this guild
    const category = req.params.category;
    const action = req.params.action;
        
    try {
        const route = require(`./routes/dashboard/delete/${category}/${action}.js`);
        route(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/get/:category/:item', async(req, res) => {
    console.log(`GET ${req.params.category}/${req.params.item} (${req.headers['user-agent']})`);
    let category = req.params.category;
    let item = req.params.item;

    try {
        const file = `./routes/get/${category}/${item}.js`;
        const checksPassed = await checkRequirements(req, res, file);
        debug(`Checks passed: ${checksPassed}`);
        if (!checksPassed) return;
        const route = require(`./routes/get/${category}/${item}.js`);
        debug(`Executing route`);
        await route(req, res);
        debug(`Route executed`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/post/:category/:item', (req, res) => {
    console.log(`POST ${req.params.category}/${req.params.item} (${req.headers['user-agent']})`);
    const category = req.params.category;
    const item = req.params.item;
    try {
        const route = require(`./routes/post/${category}/${item}.js`);
        route(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

if (process.env.HTTP == 'true') {
    https.createServer({
        // key: fs.readFileSync('/etc/letsencrypt/live/api.daalbot.xyz/privkey.pem'),
        // cert: fs.readFileSync('/etc/letsencrypt/live/api.daalbot.xyz/fullchain.pem')
     }, app).listen(port, () => {
         console.log(`Server listening on port ${port}`);
     });
} else {
    https.createServer({
        key: fs.readFileSync('/etc/letsencrypt/live/api.daalbot.xyz/privkey.pem'),
        cert: fs.readFileSync('/etc/letsencrypt/live/api.daalbot.xyz/fullchain.pem')
     }, app).listen(port, () => {
         console.log(`Server listening on port ${port}`);
     });
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!\n\n`)
})

client.login(process.env.TOKEN);

module.exports = app;