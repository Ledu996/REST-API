const crypto = require('crypto');
const config = require('../config');
const https = require('https');
const querystring = require('querystring');

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

helpers.sendTwilioSMS = (phone, msg, callback) => {
    phone = typeof phone == 'string' && phone.trim().length === 10 ? phone.trim() : false;
    msg = typeof msg == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;

    if (phone && msg) {

        const payload = {
            'From' : config.twilio.fromPhone,
            'To' : '+1' + phone,
            'Body' : msg
        };

        const stringPayload = querystring.stringify(payload);

        const requestDetails = {
            'protocol' : 'https:',
            'hostname' : 'api.twilio.com',
            'method' : 'POST',
            'path' : '/2010-04-01/Accounts/' + config.twilio.accountSid + '/Messages.json',
            'auth' : config.twilio.accountSid + ':' + config.twilio.authToken,
            'headers' : {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Content-Length' : Buffer.byteLength(stringPayload)
            }
        };

        const req = https.request(requestDetails, (res) => {
            const status = res.statusCode;
            if (status == 200 || status == 201) {
                callback(false);
            } else {
                callback('Status kod je: ' + status);
            }
        });

        req.on('error', (err) => {
            callback(err);
        });

        req.write(stringPayload);

        req.end();

    } else {
        callback('Prosledjeni parametri nisu valini ili ne postoje');
    }
}

module.exports = helpers;