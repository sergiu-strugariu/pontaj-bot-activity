import { authorizedUsers } from '../configs/config.js';

export function checkUserAuthorization(userId) {
    return authorizedUsers[userId] || null;
}

export function createCurrentUser(userId, userAuth) {
    return {
        id: userId,
        ...userAuth
    };
}