const express = require('express');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 3000;
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const client = require('./client.js');
const axios = require('axios');
const crypto = require('crypto');

/**
 * @type {Object.<string, string>}
 * Stores authorization IDs
 */
let authIdTable = {};
require('./background.js');

/**
 * Logs debug messages if HTTP environment variable is set
 * @param {string} message
 */
async function debug(message) {
    if (process.env.HTTP) console.log(`[DEBUG] ${message}`)
}

console.debug = debug; // Redirect console.debug to custom debug function

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
 * Stores cached dashboard users
 */
let dashboardUsers = [];

/**
 * @type {string[]}
 * Stores invalidated bearer tokens
 */
let invalidatedBearers = [];

app.use(cors());

app.get('/', (req, res) => {
  res.redirect('https://github.com/DaalBot/API');
});

// ==============================
// ====== Request Checking ======
// ==============================

/**
 * Performs general request checks and authorization
 * @param {express.Request} req 
 * @param {express.Response} res 
 * @param {string} file
 * @returns {Promise<boolean>}
 */
async function onReqChecks(req, res, file) {
    // General on request actions
    res.header('Access-Control-Allow-Origin', '*');

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

                            if (hashedTokens.includes(hashedToken))
                                authorized = true;
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
 * Checks dashboard authorization and performs necessary actions
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns {Promise<boolean>}
 */
async function checkDashAuth(req, res) {
    try {
        req.id = crypto.randomBytes(16).toString('hex');
        // Check the users requests for general route stuff
        debug(`Checking requirements for ${req.method} ${req.path}`);
        if (!await onReqChecks(req, res, `./routes/dashboard/${req.method.toLowerCase()}${req.path.replace('/dashboard', '')}.js`)) return false;
        if (!req.headers.authorization) {
            debug('Unauthorized - Missing Authorization Header');
            res.status(401).send({
                error: 'Unauthorized - Missing Authorization Header'
            });
            return false;
        }

        if (!req.query.guild) {
            debug('Bad Request - Missing guild query parameter');
            res.status(400).send({
                error: 'Bad Request - Missing guild query parameter'
            });
            return false;
        }

        async function pushActivity(actionObj) {
            if (!fs.existsSync(`./data/activity`)) await fsp.mkdir(`./data/activity`);
            const pushedActivity = {
                type: 'dashboard',
                ...actionObj,
                action: `${req.method}:${req.path}`,
                ts: Date.now(),
                id: req.id
            };

            if (!fs.existsSync(`./data/activity/${req.query.guild}.json`)) return await fsp.appendFile(`./data/activity/${req.query.guild}.json`, JSON.stringify([pushedActivity]));
            const activity = JSON.parse(await fsp.readFile(`./data/activity/${req.query.guild}.json`, 'utf-8'));
            activity.push(pushedActivity);

            if (activity.length > 25) activity.shift(); // Limit the activity log to x entries
            await fsp.writeFile(`./data/activity/${req.query.guild}.json`, JSON.stringify(activity));
        }

        if (req.headers.authorization.startsWith('Guild ')) { // Fixed API key for integration with external services
            const guildKeys = await fsp.readFile('./data/guild.keys', 'utf-8'); // TODO: Should just be auth.txt but thats a job for later
            const keys = guildKeys.split('\n');

            const authData = req.headers.authorization.split(' ')[1].trim().split('.');
            const hKeyGuild = Buffer.from(authData[0], 'base64').toString('utf-8').trim();
            const hKey = authData[1];

            if (req.query.guild != hKeyGuild) {
                debug(`Unauthorized - Guild Key does not match guild query parameter (${req.query.guild} != ${hKeyGuild})`);
                res.status(401).send('Unauthorized - Invalid Key');
                return false;
            }

            const hashedKey = crypto.createHash('sha256').update(hKey).digest('hex');
            const hashedGuild = crypto.createHash('sha256').update(hKeyGuild).digest('hex');
            
            const key = keys.find(key => key == `${hashedGuild}:${hashedKey}`);

            if (!key) {
                debug(`Unauthorized - Could not find key "${hashedKey}" for guild "${hashedGuild}"`);
                res.status(401).send('Unauthorized - Invalid Key');
                return false;
            } else {
                debug(`Authorized - Key "${hashedKey}" for guild "${hashedGuild}"`);

                await pushActivity({
                    executor: '0', // 0 is the ID for the API
                    type: 'automated'
                }); // Log the action
                return true;
            }
        }

        if (invalidatedBearers.includes(req.headers.authorization)) { // Avoid making requests for known bad tokens
            debug('Unauthorized - Invalid Token [Listed]');
            res.status(401).send('Unauthorized - Invalid Token [Listed]');
            return false;
        }

        async function onSuccess() {
            if (req.method == 'GET') return; // All you're doing is reading data, no need to log that
            // Check the auth lookup table
            let userId = authIdTable[req.headers.authorization] || null;
            
            if (!userId) {
                // Get the user's ID
                const userReq = await axios.get('https://discord.com/api/users/@me', {
                    headers: {
                        Authorization: `Bearer ${req.headers.authorization}`
                    }
                });

                userId = userReq.data.id;
                authIdTable[req.headers.authorization] = userId;
            }

            await pushActivity({
                executor: userId
            });
        }

        debug(`Looking for cached user`);
        const HashedToken = crypto.createHash('sha256').update(req.headers.authorization).digest('hex');
        const cachedUser = dashboardUsers.find(user => user.accesscode === req.headers.authorization);

        if (cachedUser && Date.now() - cachedUser.cachedTimestamp <= 15 * 60 * 1000) {
            debug(`Using cached user data`);
            // Use cached user data
            const guilds = cachedUser.guilds;
            const manageableGuilds = guilds.filter(guild => guild.permissions & 0x20);
            debug(`Manageable guilds: ${manageableGuilds.map(guild => guild.id).join(', ')}`);
            if (manageableGuilds.filter(guild => guild.id == req.query.guild).length != 0) {
                debug(`User has permission to manage this guild`);
                // User has permission to manage this guild
                onSuccess();
                return true;
            } else {
                debug(`User does not have permission to manage this guild`);
                return false;
            }
        }

        debug(`Getting hashed tokens`);
        const hashedTokensAndIDs = fs.readFileSync('./data/auth.txt', 'utf-8').split('\n');
        const hashedTokens = hashedTokensAndIDs.map(tokenAndID => tokenAndID.split(':')[1]);

        if (!hashedTokens.includes(HashedToken) && !process.env.HTTP) {
            res.status(401).send('Unauthorized - Token not from trusted source');
            return false;
        };

        debug(`Getting user data`);
        const guildsReq = await axios.get(`https://discord.com/api/users/@me/guilds`, {
            headers: {
                Authorization: `Bearer ${req.headers.authorization}`
            }
        })
    
        debug(`Got user data`);
        const guilds = guildsReq.data;

        // Cache the user
        dashboardUsers.push({
            accesscode: req.headers.authorization,
            guilds: guilds,
            cachedTimestamp: Date.now()
        });
        debug(`Cached user`);

        /**
         * @type {string[]}
         */
        const manageableGuilds = guilds.filter(guild => guild.permissions & 0x20).map(guild => guild.id);
        debug(`Manageable guilds: ${manageableGuilds.join(', ')}`);
    
        if (manageableGuilds.includes(req.query.guild)) {
            // User has permission to manage this guild
            debug(`User has permission to manage this guild`);
            onSuccess();
            return true;
        } else {
            debug(`User does not have manage server permission`);
            if (manageableGuilds.includes('1017715574639431680')) { // Only make these requests for users in specific guild so we don't hit the rate limit
                debug(`Checking for override permission`);
                const userReq = await axios.get('https://discord.com/api/users/@me', {
                    headers: {
                        Authorization: `Bearer ${req.headers.authorization}`
                    }
                });
    
                debug(`Got user data`);
                const user = userReq.data;
                const hashedId = crypto.createHash('sha256').update(user.id).digest('hex'); // Hash the user's ID
    
                if (hashedId === 'a16f75c75427a6a1939fda73a18aaff0d1612c106a09a036c0b531091737dc39') {
                    debug(`User has override permission`);
                    // User has permission to manage this guild
                    onSuccess();
                    return true;
                }
            }
            debug(`User does not have permission to manage this guild`);
            res.status(403).send('Forbidden - User does not have permission to manage this guild');
            return false;
        }
    } catch (error) {
        debug(`Something went wrong: ${error}`);
        error = `${error}`;
        if (error.includes('401')) {
            invalidatedBearers.push(req.headers.authorization);
            res.status(401).send('Unauthorized - Invalid Token [401]');
        } else if (error.includes('429')) {
            res.status(429).send('Too Many Requests - Discord API');
        } else {
            res.status(500).send('Internal Server Error');
        }

        debug(`Error: ${error}`);

        return false; // If an error occurs, assume the user is not authorized
    }
}

// =========================
// ====== API ROUTING ======
// =========================

async function handleDashboardRequest(req, res) {
    console.log(`${req.method} /dashboard/:category/:action`);
    const isAuthorized = await checkDashAuth(req, res);
    if (!isAuthorized) {
        return;
    }

    const category = req.params.category;
    const action = req.params.action;

    try {
        const ROOT = path.resolve(__dirname, `./routes/dashboard/${req.method.toLowerCase()}`);
        const file = path.resolve(ROOT, category, `${action}.js`);
        if (!file.startsWith(ROOT)) {
            res.status(400).send('Invalid path');
            return;
        }
        const route = require(file);
        await route(req, res);
    } catch (error) {
        console.error(`Error: ${error}`);
        res.status(500).send('Internal Server Error');
    }
}

app.get('/dashboard/:category/:action', async (req, res) => {
    await handleDashboardRequest(req, res);
});

app.post('/dashboard/:category/:action', bodyParser.json(), async(req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    await handleDashboardRequest(req, res);
});

app.delete('/dashboard/:category/:action', async(req, res) => {
    await handleDashboardRequest(req, res);
});

async function handleStandardRequest(req, res) {
    debug(`${req.method} ${req.params.category}/${req.params.item} (${req.headers['user-agent']})`);
    let category = req.params.category;
    let item = req.params.item;

    try {
        const ROOT = path.resolve(__dirname, `./routes/${req.method.toLowerCase()}`);
        const file = path.resolve(ROOT, category, `${item}.js`);
        if (!file.startsWith(ROOT)) {
            res.status(400).send('Invalid path');
            return;
        }
        const checksPassed = await onReqChecks(req, res, file);
        debug(`Checks passed: ${checksPassed}`);
        if (!checksPassed) return;
        const route = require(file);
        const executingAt = Date.now();
        debug(`Executing route`);
        await route(req, res);
        debug(`Route executed in ${(Date.now() - executingAt) / 1000}s`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

app.get('/get/:category/:item', async(req, res) => {
    await handleStandardRequest(req, res);
});

app.post('/post/:category/:item', async(req, res) => {
    await handleStandardRequest(req, res);
});

app.get('/config/:option', (req, res) => {
    const path = `./config/${req.params.option}.json.public`; // Append .public so even if the user manages to access a file outside the static folder it wont exist

    if (fs.existsSync(path)) {
        res.sendFile(path, {
            root: __dirname,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } else if (req.params.option == 'list') {
        const files = fs.readdirSync('./config');
        res.status(200).send(files.map(file => file.replace('.json.public', '')));
    } else {
        res.status(404).send('Not Found');
    }
})

const { EmbedBuilder } = require('discord.js');

app.patch('/config/:option', bodyParser.json(), (req, res) => {
    if (req.headers.authorization != process.env.BotCommunicationKey) return res.status(401).send('Unauthorized');

    const path = `./config/${req.params.option}.json.public`;

    if (fs.existsSync(path))
        fs.writeFileSync(path, `${JSON.stringify(req.body)}`);
    else
        fs.appendFileSync(path, `${JSON.stringify(req.body)}`);

    res.status(200).send('OK');
})

app.post('/render/:item', bodyParser.json(), async(req, res) => {
    debug(`POST render/${req.params.item} (${req.headers['user-agent']})`);
    const item = req.params.item;
    try {
        const baseDir = path.resolve(__dirname, './routes/render');
        const file = path.resolve(baseDir, `${item}.js`);

        // Ensure the resolved path is within the intended directory
        if (!file.startsWith(baseDir)) {
            res.status(400).send('Invalid item parameter');
            return;
        }

        const checksPassed = await onReqChecks(req, res, file);
        debug(`Checks passed: ${checksPassed}`);
        if (!checksPassed) return;
        const route = require(file);
        const executingAt = Date.now();
        debug(`Executing route`);
        await route(req, res);
        debug(`Route executed in ${(Date.now() - executingAt) / 1000}s`);
    } catch (error) {
        debug(`Error: ${error}`);
        res.status(500).send('Internal Server Error');
    }
})

http.createServer({}, app).listen(port, () => {
    debug(`Server listening on port ${port}`);
});

client.on('ready', () => {
    debug(`Logged in as ${client.user.tag}!\n\n`)

    if (process.env.HTTP) return;
    // Send a startup message
    /**
     * @type {import('discord.js').TextChannel | undefined}
    */
    const channel = client.channels.cache.get('1244647424274862250');
    if (!channel) return;

    const releaseId = fs.readFileSync('./Release.id', 'utf-8');

    const embed = new EmbedBuilder()
        .setTitle('API Started')
        .setDescription('The API has started successfully.')
        .setColor('Green')
        .setFooter({
            text: `Release ID: ${releaseId}`
        })
        .setTimestamp();

    channel.send({
        embeds: [embed]
    });
})

// Log in the bot (Unless we're testing basic routing)
if (!process.env.TEST) client.login(process.env.TOKEN);

// Testing
if (process.env.TEST) {
    // If we're testing, send requests to localhost:3000
    const axios = require('axios');

    axios.get('http://localhost:3000/get/test/ping')

    axios.post('http://localhost:3000/post/test/ping', {
        message: 'Hello, world!'
    })

    // If we get no errors above simply exit the process
    process.exit(0);
}
