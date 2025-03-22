import { requests } from './_internal';

export async function read(path: string): Promise<string> {
    const response = await requests.get(``);
    
    return ''; // Shutup, TypeScript i will get to it
}