import type { RESTGetAPIGuildChannelsResult, RESTAPIPartialCurrentUserGuild, RESTGetAPIGuildMembersResult } from 'discord-api-types/v9';
import axios from 'axios';
import tools from '$lib/tools';

const CACHE_TIME = 1000 * 60 * 60; // 1 hour

export interface GuildDataGetOptions {
    guildId: string;
    accessToken?: string;
    noCache?: boolean;
}

export interface CachedGuildData {
    userData: RESTAPIPartialCurrentUserGuild;
    channels: RESTGetAPIGuildChannelsResult;
    members: RESTGetAPIGuildMembersResult;
    time: number;
    id: string;
}

let cache: CachedGuildData[] = [];

export default async function get(options: GuildDataGetOptions): Promise<CachedGuildData | null> {
    try {
        cache = cache.filter((u) => u.time + CACHE_TIME > Date.now()); // Clear cache of old entries
        if (options.noCache) cache = cache.filter((u) => u.id !== options.guildId); // Refetch user data if noCache is true

        const foundId = cache.find((u) => u.id === options.guildId);
        if (foundId) return foundId;

        if (!options.accessToken)
            throw new Error('No cache found and no access token provided. Please provide an access token to fetch user data.');

        const userData = await tools.getUserData({
            accessToken: options.accessToken
        });

        if (!userData?.guilds?.find((g) => g.id === options.guildId))
            throw new Error('Guild not found. Please provide a valid guild ID.');

        const channelsReq = await axios.get(`https://discord.com/api/v9/guilds/${options.guildId}/channels`, {
            headers: {
                Authorization: `Bot ${process.env.TOKEN}`
            }
        });

        const channels = channelsReq.data as RESTGetAPIGuildChannelsResult;

        const membersReq = await axios.get(`https://discord.com/api/v9/guilds/${options.guildId}/members`, {
            headers: {
                Authorization: `Bot ${process.env.TOKEN}`
            }
        });
        const members = membersReq.data as RESTGetAPIGuildMembersResult;

        const cacheData = {
            channels,
            members,
            time: Date.now(),
            id: options.guildId,
            userData: userData.guilds.find((g) => g.id === options.guildId) as RESTAPIPartialCurrentUserGuild
        };

        cache.push(cacheData);

        return cacheData;
    } catch (err) {
        console.error(err);
        return null;
    }
}