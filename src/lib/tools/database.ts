import { AxiosResponse } from 'axios';
import { requests } from './_internal';

export async function read(path: string): Promise<string> {
    const request = await requests.get(`/get/database/read`, {
        'bot': 'Discord', // WHY IS THIS STILL REQUIRED
        'path': path
    }, true) as AxiosResponse;

    switch (request.status) {
        case 200:
            break;
        case 403:
            throw new Error('Forbidden');
        case 404:
            throw new Error('File not found');
        case 500:
            throw new Error('Internal server error');
        default:
            throw new Error(`Unknown error: ${request.status}`);
    }

    return request.data;
}

export async function readDir(path: string, readContents: boolean = false): Promise<Array<{ name: string, value?: string }>> {
    return await requests.get(`/get/database/readDir?skipread=${!readContents}`, {
        'bot': 'Discord',
        'path': path
    }) as unknown as Array<{ name: string, value?: string }>;
}

export async function write(path: string, data: any, encrypt: boolean = false): Promise<string> {
    return await requests.post(`/post/database/create${encrypt ? '?encrypt=1' : ''}`, {
        data
    }, {
        'bot': 'Discord',
        path,
        'type': 'file'
    });
}

export async function createDir(path: string): Promise<string> {
    return await requests.post(`/post/database/create?enc=1`, {}, {
        'bot': 'Discord',
        'path': path,
        'type': 'folder',
        'data': '.'
    });
}

export async function deleteFile(path: string): Promise<string> {
    return await requests.delete(`/delete/database/remove`, {
        'bot': 'Discord',
        'path': path,
        'type': 'file'
    });
}

export default {
    read,
    readDir,
    write,
    createDir,
    deleteFile
};