import database from './tools/database';
import permissionCheck from './tools/permissionCheck';
import userData from './tools/userData';
import guildData from './tools/guildData';

export default {
    getUserData: userData,
    getGuildData: guildData,
    hasPermission: permissionCheck,
    database,
};