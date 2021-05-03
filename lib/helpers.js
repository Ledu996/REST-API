const crypto = require('crypto');
const config = require('../config');
const https = require('https');
const querystring = require('querystring');
const path = require('path');
const fs = require('fs');

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
    strLength = typeof strLength == 'number' && strLength > 0 && strLength == 20 ? strLength : false;

    if (strLength) {
        const possibleCharacters = 'qwertyuiopasdfghjklzxcvbnm0123456789';
        let str = '';
        for (let i = 0; i < strLength; i++) {
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

helpers.getTemplate = (templateName, data, callback) => {
    templateName = typeof templateName == 'string' && templateName.length > 0 ? templateName : false;
    if (templateName) {

        const templateDir = path.join(__dirname, '/../templates/');
        fs.readFile(`${templateDir}${templateName}.html`, 'utf-8', (err, str) => {
            if (!err && str && str.length > 0) {
                
                const finalString = helpers.interpolate(str, data);
                callback(false, finalString);

            } else {
                callback('Ne postoji templejkt sa tim imenom');
            }
        });

    } else {
        callback('Ne moze se pronaci templejt');
    }
}

helpers.addUniversalTemplates = (str, data, callback) => {
    str = typeof str == 'string' && str.length > 0 ? str : '';
    data = typeof data == 'object' && data !== null ? data : {};

    helpers.getTemplate('_header', data, (err, headerString) => {
        if (!err && headerString) {

            helpers.getTemplate('_footer', data, (err, footerString) => {
                if (!err && footerString) {

                    const fullString = headerString + str + footerString;
                    callback(false, fullString);

                } else {
                    callback('Ne moze se pronaci templejt za futer');
                }
            });

        } else {
            callback('Ne moze se pronaci templejt za heder');
        }
    });
}

helpers.interpolate = (str, data) => {
    str = typeof str == 'string' && str.length > 0 ? str : '';
    data = typeof data == 'object' && data !== null ? data : {};

    for (let keyName in config.templateGlobals) {
        if (config.templateGlobals.hasOwnProperty(keyName)) {
            data['global.' + keyName] = config.templateGlobals[keyName];
        }
    }

    for (let key in data) {
        if (data.hasOwnProperty(key) && typeof data[key] == 'string') {
            const replace = data[key];
            const find = '{' + key + '}';
            str = str.replace(find, replace);
        }
    }
    return str;
}

helpers.getStaticAssets = (fileName, callback) => {
    fileName = typeof fileName == 'string' && fileName.length > 0 ? fileName : false;
    if (fileName) {
        const publicDir = path.join(__dirname, '/../public/');
        fs.readFile(`${publicDir}${fileName}`, (err, data) => {
            if (!err && data) {
                callback(false, data);
            } else {
                callback('Nije pronadjen fajl');
            }
        });
    } else {
        callback('Nije trazeno validno ime');
    }
};

module.exports = helpers;