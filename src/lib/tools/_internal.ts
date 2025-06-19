import axios, { AxiosResponse } from 'axios';

export async function get(path: string, headers?: Record<string, string>, raw?: boolean): Promise<string | AxiosResponse> {
    const response = await axios.get(`http${process.env.DEV ? 's://bot.daalbot.xyz' : '://localhost:3000'}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': process.env.BotCommunicationKey,
            ...headers
        },
        responseType: 'text'
    });

    return raw ? response : response.data;
}

export async function post(path: string, data: any = {}, headers?: Record<string, string>): Promise<string> {
    const response = await axios.post(`http${process.env.DEV ? 's://bot.daalbot.xyz' : '://localhost:3000'}${path}`, data, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': process.env.BotCommunicationKey,
            ...headers
        }
    });
    return response.data;
}

export async function deleteRequest(path: string, headers?: Record<string, string>): Promise<string> {
    const response = await axios.delete(`http${process.env.DEV ? 's://bot.daalbot.xyz' : '://localhost:3000'}${path}`, {
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