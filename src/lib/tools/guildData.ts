import type { RESTGetAPIGuildChannelsResult, RESTAPIPartialCurrentUserGuild, RESTGetAPIGuildMembersResult } from 'discord-api-types/v9';
import type { Collection, GuildMember, Role } from 'discord.js/typings';
import axios from 'axios';
import tools from '$lib/tools';
import { client } from '$app/index';

const CACHE_TIME = 1000 * 60 * 60; // 1 hour
const MAX_RETRIES = 3;

// Use Maps instead of array for better lookup performance
const cacheMap = new Map<string, CachedGuildData>();
const pendingRequests = new Map<string, Promise<CachedGuildData | null>>();

export interface GuildDataGetOptions {
    guildId: string;
    accessToken?: string;
    noCache?: boolean;
}

export interface CachedGuildData {
    userData: RESTAPIPartialCurrentUserGuild;
    channels: RESTGetAPIGuildChannelsResult;
    members: Collection<string, GuildMember>;
    roles: Collection<string, Role>;
    time: number;
    id: string;
}

async function fetchWithRetry(url: string, token: string, attempt = 1): Promise<any> {
    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: token.startsWith('Bot ') ? token : `Bot ${token}`
            }
        });
        return response;
    } catch (e) {
        if (axios.isAxiosError(e) && e.response?.data?.retry_after && attempt < MAX_RETRIES) {
            const retryAfter = e.response.data.retry_after * 1000;
            console.warn(`Rate limited, retrying in ${retryAfter}ms (attempt ${attempt}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, retryAfter));
            return fetchWithRetry(url, token, attempt + 1);
        }
        throw e;
    }
}

export default async function get(options: GuildDataGetOptions): Promise<CachedGuildData | null> {
    try {
        // Remove expired entries
        const now = Date.now();
        const oldCacheSize = cacheMap.size;
        
        for (const [key, value] of cacheMap.entries()) {
            if (now - value.time >= CACHE_TIME) {
                cacheMap.delete(key);
            }
        }

        if (oldCacheSize !== cacheMap.size) {
            console.debug(`Cleaned ${oldCacheSize - cacheMap.size} expired cache entries`);
        }

        // Clear specific cache if noCache is true
        if (options.noCache) {
            cacheMap.delete(options.guildId);
        }

        // Check cache first
        const cached = cacheMap.get(options.guildId);
        if (cached) {
            return cached;
        }

        if (!options.accessToken) {
            throw new Error('No cache found and no access token provided');
        }

        // Check for pending request
        const pending = pendingRequests.get(options.guildId);
        if (pending) {
            console.debug('Returning pending request for guild');
            return pending;
        }

        // Create new promise for this request
        const promise = (async () => {
            try {
                const userData = await tools.getUserData({
                    accessToken: options.accessToken
                });

                if (!userData?.guilds?.find((g) => g.id === options.guildId)) {
                    throw new Error('Guild not found');
                }

                const DJSGuild = client.guilds.cache.get(options.guildId);
                if (!DJSGuild) {
                    throw new Error('Guild not found in cache');
                }

                const [channelsReq, members] = await Promise.all([
                    fetchWithRetry(`https://discord.com/api/v9/guilds/${options.guildId}/channels`, process.env.TOKEN!),
                    DJSGuild.members.fetch()
                ]);

                const cacheData: CachedGuildData = {
                    channels: channelsReq.data,
                    members,
                    roles: DJSGuild.roles.cache,
                    time: Date.now(),
                    id: options.guildId,
                    userData: userData.guilds.find((g) => g.id === options.guildId) as RESTAPIPartialCurrentUserGuild
                };

                cacheMap.set(options.guildId, cacheData);
                console.debug('Cached guild data');
                return cacheData;
            } finally {
                pendingRequests.delete(options.guildId);
            }
        })();

        pendingRequests.set(options.guildId, promise);
        return promise;
    } catch (err) {
        console.error('Error fetching guild data:', err);
        return null;
    }
}