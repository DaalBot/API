import database from './tools/database';
import permissionCheck from './tools/permissionCheck';
import userData from './tools/userData';

export default {
    getUserData: userData,
    hasPermission: permissionCheck,
    database,
};