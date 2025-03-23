import { requests } from './_internal';

export async function read(path: string): Promise<string> {
    return await requests.get(`/get/database/read`, {
        'bot': 'Discord', // WHY IS THIS STILL REQUIRED
        'path': path
    });
}

export async function readDir(path: string, readContents: boolean = false): Promise<Array<{ name: string, value?: string }>> {
    return await requests.get(`/get/database/readDir?skipread=${!readContents}`, {
        'bot': 'Discord',
        'path': path
    }) as unknown as Array<{ name: string, value?: string }>;
}

export async function write(path: string, data: any): Promise<string> {
    return await requests.post(`/post/database/create?enc=1`, {
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