// Import necessary modules and types
import nPath from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import type { RouteMetadata } from '../src/lib/types.js';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = nPath.dirname(__filename);

// Define paths relative to project root
const projectRoot = nPath.resolve(__dirname, '..');
const routesFolder = nPath.join(projectRoot, 'src/routes');

/**
 * Recursively gets a list of all files in a directory and its subdirectories
 * @param path - The directory path to search
 * @returns Promise containing array of file paths
 */
async function getFileList(path: string): Promise<string[]> {
    console.log(`Scanning directory: ${path}`);
    const files = await fs.readdir(path, { withFileTypes: true });
    const fileList: string[] = [];
    
    for (const file of files) {
        if (file.isDirectory()) {
            console.log(`Found subdirectory: ${file.name}`);
            fileList.push(...await getFileList(`${path}/${file.name}`));
        } else {
            console.log(`Found file: ${file.name}`);
            fileList.push(`${path}/${file.name}`);
        }
    }
    
    return fileList;
}

// Define interface for route documentation
interface Route {
    method: string;       // HTTP method (GET, POST, etc.)
    route: string;        // URL path
    meta: RouteMetadata;  // Metadata about the route
    type: 'Public' | 'Internal' | 'Dashboard';  // Route access type
}

(async() => {
    console.log('Starting documentation generation...');
    const output: Route[] = [];

    const files = await getFileList(routesFolder);
    console.log(`Found ${files.length} total files to process`);

    for (const file of files) {
        console.log(`\nProcessing file: ${file}`);
        
        // Import the route file using absolute path
        const absolutePath = nPath.resolve(projectRoot, file);
        const importPath = `file://${absolutePath}`.replace('.ts', '.js');
        const fileData = await import(importPath);
        console.log('File imported successfully');
        
        // Extract metadata and path information
        const meta: RouteMetadata = (await fileData).meta;
        const path = file.replace(routesFolder, '').replace('.ts', '');
        const method = path.replace('/dashboard', '').split('/')[1].toLowerCase();
        let route = '/' + path.split('/').slice(2).join('/');

        console.log(`Original path: ${path}`);
        console.log(`Detected method: ${method}`);
        console.log(`Initial route: ${route}`);

        // Determine route type
        let type: 'Public' | 'Dashboard' | 'Internal' = 'Public';
        if (path.startsWith('/dashboard')) {
            type = 'Dashboard';
            console.log('Route type: Dashboard');
        }
        if (meta.authorization == 'Locked') {
            type = 'Internal';
            console.log('Route type: Internal');
        }

        // Clean up route path
        if (route.match(/(get|post|put|delete)/)) {
            route = route.replace(/\/(get|post|put|delete)/, '');
            console.log(`Cleaned route: ${route}`);
        }

        // Add dashboard prefix and additional query parameters for dashboard routes
        if (type == 'Dashboard') {
            route = '/dashboard' + route;
            console.log(`Added dashboard prefix: ${route}`);

            // Add guild parameter to dashboard routes
            meta.query = {
                ...meta.query,
                guild: {
                    type: 'string',
                    description: 'The ID of the guild to perform the action on',
                    required: true
                }
            };
            console.log('Added guild parameter to query metadata');
        }

        console.log(`Final route: ${method.toUpperCase()} ${route}`);

        // Add route to output array
        output.push({
            method,
            route,
            meta,
            type
        });
    }

    console.log('\nWriting documentation to docs.json...');
    await fs.writeFile(nPath.join(projectRoot, 'docs.json'), JSON.stringify(output, null, 4));
    console.log('Documentation generation complete!');
})();