const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
/**
 * @type {string[]}
*/
const files = [];

async function walk(dir) {
    const dirFiles = (await fs.readdir(dir)).filter(file => !file.endsWith('.res.js') && !file.startsWith('.'));

    for (let i = 0; i < dirFiles.length; i++) {
        const file = dirFiles[i];
        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);

        if (stats.isDirectory()) {
            await walk(filePath);
        } else {
            files.push(filePath);
        }
    }
}

async function main() {
    await walk('routes');
    // const spec = files.map(file => {
    //     return {
    //         route: file.replace('routes', '').replace('.js', ''),
    //         method: file.replace('routes', '').replace('/dashboard/', '').split('/')[0].toUpperCase(),
    //         type: file.includes('/dashboard/') ? 'dashboard' : 'normal',
    //         response: fsSync.existsSync(file.replace('.js', '.res.js')) ? require(file.replace('.js', '.res.js')) : null
    //     };
    // });

    /**
     * @type {{route:string,method:string,type:string,response:string|null}[]}
    */
    const spec = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let object = {};

        object.route = file.replace('routes', '').replace('.js', '');
        object.method = file.replace('routes', '').replace('/dashboard/', '').split('/')[0].toUpperCase();
        object.type = file.includes('/dashboard/') ? 'dashboard' : 'normal';

        if (fsSync.existsSync(file.replace('.js', '.res.js'))) { 
            object.response = require(`./${file.replace('.js', '.res.js')}`);
        } else object.response = {};

        if (object.type === 'dashboard') {
            const errors401 = [
                {
                    error: 'Unauthorized - Missing Authorization Header'
                },
                'Unauthorized - Token not from trusted source',
                'Unauthorized - Invalid Token',
            ]
            if (object.response['401']) {
                // Determine if the route is a array
                if (object.response['401'].length) {
                    for (let i = 0; i < errors401.length; i++) {
                        object.response['401'].push(errors401[i]);
                    }
                } else {
                    let arr = [];
                    arr.push(object.response['401']);
                    for (let i = 0; i < errors401.length; i++) {
                        arr.push(errors401[i]);
                    }
                }
            } else {
                object.response['401'] = errors401;
            }

            const errors403 = [
                'Unauthorized - User does not have permission to manage this guild'
            ]
            if (object.response['403']) {
                // Determine if the route is a array
                if (object.response['403'].length) {
                    for (let i = 0; i < errors403.length; i++) {
                        object.response['403'].push(errors403[i]);
                    }
                } else {
                    let arr = [];
                    arr.push(object.response['403']);
                    for (let i = 0; i < errors403.length; i++) {
                        arr.push(errors403[i]);
                    }
                }
            } else {
                object.response['403'] = errors403;
            }

            const errors429 = [
                'Too Many Requests - Discord API'
            ]
            if (object.response['429']) {
                // Determine if the route is a array
                if (object.response['429'].length) {
                    for (let i = 0; i < errors429.length; i++) {
                        object.response['429'].push(errors429[i]);
                    }
                } else {
                    let arr = [];
                    arr.push(object.response['429']);
                    for (let i = 0; i < errors429.length; i++) {
                        arr.push(errors429[i]);
                    }
                }
            } else {
                object.response['429'] = errors429;
            }
        }

        spec.push(object);
    }

    await fs.writeFile('spec.json', JSON.stringify(spec));
}

main();