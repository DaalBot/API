import type { RESTGetAPIGuildChannelsResult, RESTAPIPartialCurrentUserGuild, RESTGetAPIGuildMembersResult } from 'discord-api-types/v9';
import type { Collection, GuildMember, Role } from 'discord.js/typings';
import axios from 'axios';
import tools from '$lib/tools';
import { client } from '$app/index';

const CACHE_TIME = 1000 * 60 * 60; // 1 hour

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

        const DJSGuild = client.guilds.cache.get(options.guildId);
        if (!DJSGuild) 
            throw new Error('Guild not found in cache. Please provide a valid guild ID.');

        const channelsReq = await axios.get(`https://discord.com/api/v9/guilds/${options.guildId}/channels`, {
            headers: {
                Authorization: `Bot ${process.env.TOKEN}`
            }
        });

        const channels = channelsReq.data as RESTGetAPIGuildChannelsResult;

        const members = await DJSGuild.members.fetch();
        const roles = DJSGuild.roles.cache;

        const cacheData: CachedGuildData = {
            channels,
            members,
            roles,
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