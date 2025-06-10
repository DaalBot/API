import type { RESTGetAPICurrentUserResult, RESTGetAPICurrentUserGuildsResult } from 'discord-api-types/v9';
import axios from 'axios';

const CACHE_TIME = 1000 * 60 * 60; // 1 hour
const MAX_RETRIES = 3;

// Cache and pending requests (requests have to be pended to avoid more requests flowing in before the first one has cached the data)
const cacheMap = new Map<string, CachedUserData>();
const pendingRequests = new Map<string, Promise<CachedUserData | null>>();

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


// Add this helper function before the main get function
async function fetchWithRetry(url: string, token: string, attempt = 1): Promise<any> {
    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response;
    } catch (e) {
        if (axios.isAxiosError(e)) {
            if (e.response?.data?.retry_after && attempt < MAX_RETRIES) {
                const retryAfter = e.response.data.retry_after * 1000; // Convert to ms
                console.warn(`Rate limited, retrying in ${retryAfter}ms (attempt ${attempt}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, retryAfter));
                return fetchWithRetry(url, token, attempt + 1);
            }

            console.error('Error fetching data from Discord API:', e.response?.data);
        }
        throw e;
    }
}

export default async function get(options: UserDataGetOptions): Promise<CachedUserData | null> {
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
        if (options.noCache && options.accessToken) {
            cacheMap.delete(options.accessToken);
        }

        // Search cache
        if (options.userId) {
            for (const data of cacheMap.values()) {
                if (data.user.id === options.userId) {
                    return data;
                }
            }
        }

        if (options.accessToken) {
            const found = cacheMap.get(options.accessToken);
            if (found) {
                return found;
            }
        }

        if (options.username) {
            for (const data of cacheMap.values()) {
                if (data.user.username === options.username) {
                    return data;
                }
            }
        }

        if (!options.accessToken) {
            throw new Error('No access token provided and no cache to fetch from');
        }

        if (options.accessToken) {
            // Check for pending request with same token
            const pending = pendingRequests.get(options.accessToken);
            if (pending) {
                return pending;
            }
        
            // Create new promise for this request
            const promise = (async () => {
                try {
                    const [userReq, guildReq] = await Promise.all([
                        fetchWithRetry('https://discord.com/api/v9/users/@me', options.accessToken!),
                        fetchWithRetry('https://discord.com/api/v9/users/@me/guilds', options.accessToken!)
                    ]);
        
                    const user = userReq.data as RESTGetAPICurrentUserResult;
                    const guilds = guildReq.data as RESTGetAPICurrentUserGuildsResult;
        
                    const cacheData = {
                        user,
                        guilds,
                        accessToken: options.accessToken!,
                        time: Date.now()
                    };
        
                    cacheMap.set(options.accessToken!, cacheData);
                    console.debug('Cached user data from Discord API');
                    return cacheData;
                } catch (e) {
                    console.error('Error fetching user data from Discord API:', e);
                    return null; // Return null if there's an error
                }
                finally {
                    pendingRequests.delete(options.accessToken!);
                }
            })();
        
            pendingRequests.set(options.accessToken, promise);
            return promise;
        }
        
        return null; // Add explicit return for the case when none of the conditions are met
    } catch (e) {
        if (axios.isAxiosError(e)) {
            console.error('Error fetching user data from Discord API:', e.response?.data);
        } else {
            console.error('Error fetching user data from Discord API:', e);
        }
        return null;
    }
}