import type { RESTGetAPICurrentUserResult, RESTGetAPICurrentUserGuildsResult } from 'discord-api-types/v9';
import axios from 'axios';

const CACHE_TIME = 1000 * 60 * 60; // 1 hour

export interface UserDataGetOptions {
    userId?: string;
    accessToken?: string;
    username?: string;
    noCache?: boolean;
}

export interface CachedUserData {
    user: RESTGetAPICurrentUserResult;
    guilds: RESTGetAPICurrentUserGuildsResult;
    accessToken: string;
    time: number;
}

let cache: CachedUserData[] = [];

export default async function get(options: UserDataGetOptions): Promise<CachedUserData | null> {
    try {
        cache = cache.filter((u) => u.time + CACHE_TIME > Date.now()); // Clear cache of old entries
        if (options.noCache) cache = cache.filter((u) => u.accessToken !== options.accessToken); // Refetch user data if noCache is true

        const foundId = cache.find((u) => u.user.id === options.userId);
        if (foundId) return foundId;

        const foundToken = cache.find((u) => u.accessToken === options.accessToken);
        if (foundToken) return foundToken;

        const foundUsername = cache.find((u) => u.user.username === options.username);
        if (foundUsername) return foundUsername;

        if (!options.accessToken) throw new Error('No access token provided and no cache to fetch from');

        const userReq = await axios.get('https://discord.com/api/v9/users/@me', {
            headers: {
                Authorization: `Bearer ${options.accessToken}`
            }
        });

        const guildReq = await axios.get('https://discord.com/api/v9/users/@me/guilds', {
            headers: {
                Authorization: `Bearer ${options.accessToken}`
            }
        });

        const user = userReq.data as RESTGetAPICurrentUserResult;
        const guilds = guildReq.data as RESTGetAPICurrentUserGuildsResult;

        const cacheData = {
            user,
            guilds,
            accessToken: options.accessToken,
            time: Date.now()
        };

        cache.push(cacheData);
        return cacheData;
    } catch (e) {
        console.error(e);
    }

    return null;
}