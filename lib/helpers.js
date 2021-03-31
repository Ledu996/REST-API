const crypto = require('crypto');
const config = require('../config');

const helpers = {};

helpers.hash = (str) => {
    if (typeof str == 'string' && str.length >= 8) {
        const hash = crypto.createHmac("sha256", config.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }
};

helpers.parseJsonObject = (str) => {
    try {
        const obj = JSON.parse(str);
        return obj;
    } catch (error) {
        return {};
    }
};

helpers.createRandomString = (strLength) => {
    strLength = typeof strLength == 'number' && strLength > 0 ? strLength : false;

    if (strLength) {
        const possibleCharacters = 'qwertyuiopasdfghjklzxcvbnm0123456789';
        let str = '';
        for (let i = 0; i <= strLength; i++) {
            const randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            str += randomCharacter;
        }
        return str;
    } else {
        return false;
    }
};

module.exports = helpers;