import 'dotenv/config';
import express from 'express';
import tools from './tools';
import crypto from 'crypto';
import fs from 'fs/promises';
import { PermissionFlagsBits } from 'discord-api-types/v10';
const app: express.Application = express();

app.get('/', (req, res) => {
    res.send('Hello World!');
});

function convertRouteToFile(req: express.Request): string {
    let file = './routes';

    if (req.path.startsWith('/dashboard/')) file += `/dashboard/${req.method.toLowerCase()}`;
    else file += `/${req.method.toLowerCase()}`;

    file += `${req.path.replace(`/dashboard`, '')}`;

    return file;
}

async function checkDashboardAuth(req: express.Request, res: express.Response): Promise<boolean> {
    if (!req.query.guild || !req.headers.authorization) return false; // If the request doesn't have a guild ID or an authorization header, return false
    if (!req.headers.authorization.startsWith('User ') && !req.headers.authorization.startsWith('Guild ') && !req.headers.authorization.startsWith('Comm ')) return false;

    const trustedKeyStore: { users: Array<{ id: string, token: string }>, guilds: Array<{ id: string, token: string }> } = JSON.parse(await fs.readFile(`${process.env.DB_DIR}/auth.json`, 'utf-8'));
    const authToken = req.headers.authorization.split(' ')[1];

    if (req.headers.authorization.startsWith('User ')) {
        // Check if the access token is trusted
        const hashedToken = crypto.createHash('sha256').update(authToken).digest('hex');

        if (!trustedKeyStore.users.find((u) => u.token === hashedToken)) {
            res.status(401).json({
                ok: false,
                error: 'Untrusted access token'
            });
            return false;
        }
        
        const userData = await tools.getUserData({
            accessToken: authToken
        });

        if (!userData) {
            res.status(401).json({
                ok: false,
                error: 'Invalid access token or other error (couldn\'t fetch user data)'
            });
            return false;
        }

        const guild = userData.guilds.find((g) => g.id === req.query.guild);
        if (!guild) { res.status(403).json({
            ok: false,
            error: 'You are not in this guild'
        }); return false; }

        const routeData = await import(`${convertRouteToFile(req)}`);

        let requiredPermissions = routeData.permissions;
        if (!requiredPermissions) requiredPermissions = [PermissionFlagsBits.ManageGuild]; // Default to Manage Guild if no permissions are specified

        for (let i = 0; i < requiredPermissions.length; i++) {
            if (!((BigInt(guild.permissions) & BigInt(requiredPermissions[i])) === BigInt(requiredPermissions[i]))) {
                res.status(403).json({
                    ok: false,
                    error: `You do not have the required permissions to access this route (Failed ${requiredPermissions[i]} / #${i + 1})`
                });
                return false;
            }
        }
    }

    else if (req.headers.authorization.startsWith('Guild ')) {
        const segments = authToken.split('.');
        if (segments.length !== 2) {res.status(401).json({
            ok: false,
            error: 'Incorrect token format'
        });return false;}

        const encId = segments[0];
        const token = segments[1];
        const id = Buffer.from(encId, 'base64').toString('utf-8').trim();
        const hashedId = crypto.createHash('sha256').update(id).digest('hex');

        if (id != req.query.guild) {res.status(401).json({
            ok: false,
            error: 'Incorrect guild ID'
        });return false;}

        const guild = trustedKeyStore.guilds.find((g) => g.id === hashedId);
        if (!guild) {res.status(401).json({
            ok: false,
            error: 'Nonexistent guild'
        });return false;}

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        if (guild.token !== hashedToken) {res.status(401).json({
            ok: false,
            error: 'Invalid token'
        });return false;}
    }

    else if (req.headers.authorization.startsWith('Comm ') && authToken !== process.env.BotCommunicationKey) {
        res.status(401).json({
            ok: false,
            error: 'Invalid key'
        });
        return false;
    }

    return true;
}

async function handleRequest(req: express.Request, res: express.Response) {
    try {
        res.header('Access-Control-Allow-Origin', '*'); // Allow all origins (Cors be damned)

        if (!req.path.startsWith('/dashboard/')) return;

        const routeData = await import(`${convertRouteToFile(req)}`);
        const result = await routeData.exec(req, res);

        if (result) res.json({
            ok: true,
            data: result
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({
            ok: false,
            error: 'Internal server error during prerequest handling'
        });
    }
}

async function handleDashboardRequest(req: express.Request, res: express.Response) {
    await handleRequest(req, res);
    if (!(await checkDashboardAuth(req, res))) return; // If the user isn't authorized, return (function will handle sending the response)

    try {
        const routeData = await import(`${convertRouteToFile(req)}`);
        const result = await routeData.exec(req, res);

        if (result) res.json({
            ok: true,
            data: result
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({
            ok: false,
            error: 'Internal server error'
        });
    }
}

app.get('/dashboard/*', async(req, res) => {handleDashboardRequest(req, res)});
app.post('/dashboard/*', async(req, res) => {handleDashboardRequest(req, res)});
app.delete('/dashboard/*', async(req, res) => {handleDashboardRequest(req, res)});

app.get('*', async(req, res) => {handleRequest(req, res)});
app.post('*', async(req, res) => {handleRequest(req, res)});
app.delete('*', async(req, res) => {handleRequest(req, res)});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});