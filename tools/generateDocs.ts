const routesFolder = './src/routes';
import type { RouteMetadata } from '../src/lib/types.ts';
import fs from 'node:fs/promises';

async function getFileList(path: string): Promise<string[]> {
    const files = await fs.readdir(path, { withFileTypes: true });
    const fileList: string[] = [];
    for (const file of files) {
        if (file.isDirectory()) {
            fileList.push(...await getFileList(`${path}/${file.name}`));
        } else {
            fileList.push(`${path}/${file.name}`);
        }
    }
    return fileList;
}

interface Route {
    method: string;
    route: string;
    meta: RouteMetadata;
    type: 'Public' | 'Internal' | 'Dashboard';
}

export const generate = (async() => {
    const output: Route[] = [];

    for (const file of await getFileList(routesFolder)) {
        const fileData = import(file.replace('.ts', ''));
        
        const meta: RouteMetadata = (await fileData).meta;
        const path = file.replace(routesFolder, '').replace('.ts', '');
        const method = path.replace('/dashboard', '').split('/')[1].toLowerCase();
        let route = '/' + path.split('/').slice(2).join('/');

        let type: 'Public' | 'Dashboard' | 'Internal' = 'Public';
        if (path.startsWith('/dashboard')) type = 'Dashboard';
        if (meta.authorization == 'Locked') type = 'Internal';

        if (route.match(/(get|post|put|delete)/)) 
            route = route.replace(/\/(get|post|put|delete)/, '');

        if (type == 'Dashboard') {
            route = '/dashboard' + route;

            meta.query = {
                ...meta.query,
                guild: {
                    type: 'string',
                    description: 'The ID of the guild to perform the action on',
                    required: true
                }
            };
        }

        output.push({
            method,
            route,
            meta,
            type
        });
    }

    fs.writeFile('./docs.json', JSON.stringify(output, null, 2));
});