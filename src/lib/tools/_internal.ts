import axios from 'axios';

export async function get(path: string, headers?: Record<string, string>): Promise<string> {
    const response = await axios.get(`https://bot.daalbot.xyz${path}`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': process.env.BotCommunicationKey,
            ...headers
        }
    });
    return response.data;
}

export async function post(path: string, data: any = {}, headers?: Record<string, string>): Promise<string> {
    const response = await axios.post(`https://bot.daalbot.xyz${path}`, data, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': process.env.BotCommunicationKey,
            ...headers
        }
    });
    return response.data;
}

export async function deleteRequest(path: string, headers?: Record<string, string>): Promise<string> {
    const response = await axios.delete(`https://bot.daalbot.xyz${path}`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': process.env.BotCommunicationKey,
            ...headers
        }
    });
    return response.data;
}

export const requests = {
    get,
    post,
    delete: deleteRequest
}