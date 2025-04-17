import 'dotenv/config';
import express from 'express';
import tools from '$lib/tools';
import type { RouteMetadata } from '$lib/types';
import crypto from 'crypto';
import fs from 'fs/promises';
import fss from 'fs';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import bodyParser from 'body-parser';
const app: express.Application = express();

interface TrustedKeyStore {
    users: Array<{ id: string, token: string }>;
    guilds: Array<{ id: string, token: string }>;
}

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

function convertRouteToFile(req: express.Request): string {
    let file = './routes';

    if (req.path.startsWith('/dashboard/')) file += `/dashboard/${req.method.toLowerCase()}`;
    else file += `/${req.method.toLowerCase()}`;

    file += `${req.path.replace(`/dashboard`, '')}`;

    if (req.path.endsWith('/')) file = file.slice(0, -1); // Remove trailing slash

    //// if (!fss.existsSync(`${file}.ts`)) {
    ////     // If the file doesn't exist, check for if its a dynamic route
    ////     function readPreviousDir(path: string) {
    ////         const segments = path.split('/');
    ////         segments.pop();
    ////         return fss.readdirSync(`${__dirname}/routes${segments.join('/')}`, { withFileTypes: true });
    ////     }

    ////     function checkPreviousDir(path: string) {
    ////         const fileList = readPreviousDir(path);

    ////         if (fileList.find((f) => f.name === 'overrides.json')) {
    ////             // @ts-ignore - Are you fucking stupid?
    ////             return fileList.find((f) => f.name == 'overrides.json');
    ////         }
    ////     }
    //// }

    return file;
}

async function checkMetaAuth(req: express.Request, res: express.Response): Promise<boolean> {
    const routeData = await import(`${convertRouteToFile(req)}`);
    const meta: RouteMetadata = routeData.meta;

    // Authentication checks
    if (!req.path.startsWith('/dashboard/')) { // If the request is a dashboard request, it will handle its own authentication
        if (meta.authorization === 'None') return true;
        if (!req.headers.authorization) {
            res.status(401).json({
                ok: false,
                error: 'No authorization header'
            });
            return false;
        }
    
        if (meta.authorization == 'Locked' && !req.headers.authorization.startsWith('Comm ')) {
            if (req.headers.authorization.split(' ')[1] !== process.env.BotCommunicationKey) {
                res.status(403).json({
                    ok: false,
                    error: 'Invalid communication key'
                });
                return false;
            } else return true;
        };
    
        if (meta.authorization == 'User' && !req.headers.authorization.startsWith('User ')) {
            res.status(403).json({
                ok: false,
                error: 'Invalid authorization header'
            });
            return false;
        }
    
        if (meta.authorization == 'Guild' && !req.headers.authorization.startsWith('Guild ')) {
            res.status(403).json({
                ok: false,
                error: 'Invalid authorization header'
            });
            return false;
        }
    
        switch (meta.authorization) {
            case 'User':
                const userData = await tools.getUserData({
                    accessToken: req.headers.authorization.split(' ')[1]
                });
    
                if (!userData) {
                    res.status(401).json({
                        ok: false,
                        error: 'Invalid access token or other error (couldn\'t fetch user data)'
                    });
    
                    return false;
                }
                break;
    
            case 'Guild':
                const segments = req.headers.authorization.split(' ')[1].split('.');
                if (segments.length !== 2) {
                    res.status(401).json({
                        ok: false,
                        error: 'Incorrect token format'
                    });
                    return false;
                }
    
                const encId = segments[0];
                const token = segments[1];
                const id = Buffer.from(encId, 'base64').toString('utf-8').trim();
                const hashedId = crypto.createHash('sha256').update(id).digest('hex');
                const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
                const trustedKeyStore: TrustedKeyStore = JSON.parse(await fs.readFile(`${process.env.DB_DIR}/auth.json`, 'utf-8'));
                const guild = trustedKeyStore.guilds.find((g) => g.id === hashedId);
    
                if (!guild) {
                    res.status(401).json({
                        ok: false,
                        error: 'Nonexistent guild in store'
                    });
                    return false;
                }
    
                if (guild.token !== hashedToken) {
                    res.status(401).json({
                        ok: false,
                        error: 'Invalid token'
                    });
                    return false;
                }
                break;
        }
    }

    return true;
}

async function checkDashboardAuth(req: express.Request, res: express.Response): Promise<boolean> {
    if (process.env.DANGEROUS_BYPASS_DASH_AUTH_SERIOUSLY_NEVER_USE_THIS_IN_PROD_LIKE_EVER == 'true' && process.env.DEV == '1') return true; // Testing only (obviously)
    if (process.env.DANGEROUS_BYPASS_DASH_AUTH_SERIOUSLY_NEVER_USE_THIS_IN_PROD_LIKE_EVER === 'true' && process.env.DEV != '1') {
        throw new Error('DANGEROUS_BYPASS_DASH_AUTH flag must not be enabled in production.');
    }
    if (!req.query.guild || !req.headers.authorization) return false; // If the request doesn't have a guild ID or an authorization header, return false
    if (!req.headers.authorization.startsWith('User ') && !req.headers.authorization.startsWith('Guild ')) return false;

    const trustedKeyStore: TrustedKeyStore = JSON.parse(await fs.readFile(`${process.env.DB_DIR}/auth.json`, 'utf-8'));
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

    return true;
}

async function handleRequest(req: express.Request, res: express.Response) {
    try {
        res.header('Access-Control-Allow-Origin', '*');

        // Check metadata and auth first
        const isValid = await checkMetaAuth(req, res);
        if (!isValid) return;
        
        if (req.path.startsWith('/dashboard/')) return;
        
        const routeData: {
            exec: (req: express.Request, res: express.Response) => Promise<any>,
            meta: RouteMetadata
        } = await import(`${convertRouteToFile(req)}`);

        // Return early if any required query params are missing
        let missingParams = Object.entries(routeData.meta.query || {})
            .filter(([_, value]) => value.required)
            .map(([key]) => key)
            .filter(key => !req.query[key]);

        if (missingParams.length > 0) {
            res.status(400).json({
                ok: false,
                error: `Missing required query parameters: ${missingParams.join(', ')}`
            });
            return;
        }

        missingParams=Object.entries(routeData.meta.query || {}).filter(([_, value]) => value.required).map(([key]) => key).filter(key => !req.query[key]);

        if (missingParams.length > 0) {
            res.status(400).json({
                ok: false,
                error: `Missing required query parameters: ${missingParams.join(', ')}`
            });
            return;
        }

        const result = await routeData.exec(req, res);

        if (!res.headersSent) {
            res.json({
                ok: true,
                data: result
            });
        }
    } catch (e) {
        console.error(e);
        if (!res.headersSent) {
            res.status(500).json({
                ok: false,
                error: 'Internal server error during prerequest handling'
            });
        }
    }
}

async function handleDashboardRequest(req: express.Request, res: express.Response) {
    await handleRequest(req, res);
    if (!(await checkDashboardAuth(req, res))) return; // If the user isn't authorized, return (function will handle sending the response)

    try {
        const routeData = await import(`${convertRouteToFile(req)}`);
        const result = await routeData.exec(req, res);

        if (result && !res.headersSent) res.json({
            ok: true,
            data: result
        });

        // Log the request
        if (req.method != 'GET') {
            const logPath = `${process.env.DB_DIR}/activity/${req.query.guild}.json`;
            const currentActivity: {method:string,route:string,ts:number,executor:string,comment:string|null}[] = JSON.parse(fss.existsSync(logPath) ? await fs.readFile(logPath, 'utf8') : '[]');
            let newData = currentActivity;

            newData.push({
                method: req.method,
                route: req.path,
                ts: Date.now(),
                executor: req.headers.authorization?.startsWith('Guild ') ? '0' : ((await tools.getUserData({
                    accessToken: req.headers.authorization?.split(' ')[1]
                }))?.user.id || '-1'),
                comment: routeData.comment || null
            })

            if (newData.length > 25) newData.shift();

            await fs.writeFile(logPath, JSON.stringify(newData), 'utf8');
        }
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

app.listen(process.env.PORT || 3001, () => {
    console.log(`Server started on port ${process.env.PORT || 3001}`);
});