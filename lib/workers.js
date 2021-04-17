const path = require('path');
const fs = require('fs');
const _data = require('./data');
const https = require('https');
const http = require('http');
const helpers = require('./helpers');
const url = require('url');
const _logs = require('./logs');

const workers = {};

workers.gatherAllChecks = () => {
    _data.list('checks', (err, checks) => {
        if (!err && checks && checks.length > 0) {
            checks.forEach((check) => {

                _data.read('checks', check, (err, checkData) => {
                    if (!err && checkData) {
                        console.log(checkData, typeof checkData);
                        console.log(checkData.id, typeof checkData.id, typeof checkData.id =='string', checkData.id.trim().length === 20, checkData.id.trim().length);
                        workers.validateCheckData(checkData);
                    } else {
                        console.log('Greska prilikom citanja fajla', err);
                    }
                });

            });
        } else {
            console.log('Error: Nije moguce naci check-ove');
        }
    });
};

workers.validateCheckData = (checkData) => {
    checkData = typeof checkData == 'object' && checkData !== null ? checkData : {};
    checkData.id = typeof checkData.id == 'string' && checkData.id.trim().length == 20 ? checkData.id.trim() : false;
    checkData.userPhone = typeof checkData.userPhone == 'string' && checkData.userPhone.trim().length == 10 ? checkData.userPhone.trim() : false;
    checkData.protocol = typeof checkData.protocol == 'string' && ['http', 'https'].indexOf(checkData.protocol) > -1 ? checkData.protocol : false;
    checkData.url = typeof checkData.url == 'string' && checkData.url.trim().length > 0 ? checkData.url.trim() : false;
    checkData.method = typeof checkData.method == 'string' && ['post', 'get', 'put', 'delete'].indexOf(checkData.method) > -1 ? checkData.method : false;
    checkData.successCodes = typeof checkData.successCodes == 'object' && checkData.successCodes instanceof Array && checkData.successCodes.length > 0 ? checkData.successCodes : false;
    checkData.timeoutSecond = typeof checkData.timeoutSecond == "number" && checkData.timeoutSecond % 1 === 0 && checkData.timeoutSecond >= 1 && checkData.timeoutSecond <= 5 ? checkData.timeoutSecond : false;
    
    console.log(Boolean(checkData), Boolean(checkData.id), Boolean(checkData.userPhone),
         Boolean(checkData.protocol), Boolean(checkData.url), Boolean(checkData.method),
          Boolean(checkData.successCodes), Boolean(checkData.timeoutSecond));
    
    checkData.state = typeof checkData.state == 'string' && ['up', 'down'].indexOf(checkData.state) > -1 ? checkData.state : 'down';
    checkData.lastChecked = typeof checkData.lastChecked == 'number' && checkData.lastChecked > 0 ? checkData.lastChecked : false;
    
    if (checkData.id && checkData.userPhone && checkData.protocol && checkData.url && checkData.method && checkData.successCodes && checkData.timeoutSeconds) {    
        workers.performCheck(checkData);
    } else {
        console.log('Nedostaju podaci za jedan od fajlova sa imenom: ' + checkData.id + '.json');
    }
};

workers.performCheck = (checkData) => {

    const checkOutcome = {
        'error': false,
        'responseCode': false
    };

    let outcomeSent = false;

    const parsedURL = url.parse(checkData.protocol + '://' + checkData.url, true);
    const hostName = parsedURL.hostname;
    const path = parsedURL.path;

    const requestDetails = {
        'protocol': checkData.protocol + ':',
        'hostname': hostName,
        'method': checkData.method.toUpperCase(),
        'path': path,
        'timeout': checkData.timeoutSeconds * 1000
    };

    const _moduleToUse = checkData.protocol == 'http' ? http : https;
    const req = _moduleToUse.request(requestDetails, (res) => {
        const status = res.statusCode;

        checkOutcome.responseCode = status;
        if (!outcomeSent) {
            worker.processCheckOutcome(checkData, checkOutcome);
            outcomeSent = true;
        }
    });

    req.on('error', (err) => {
        checkOutcome.error = {'error' : true, 'value' : err.message};
        if (!outcomeSent) {
            worker.processCheckOutcome(checkData, checkOutcome);
            outcomeSent = true;
        }
    });

    req.on('timeout', () => {
        checkOutcome.error = {'error' : true, 'value' :'timeout'};
        if (!outcomeSent) {
            worker.processCheckOutcome(checkData, checkOutcome);
            outcomeSent = true;
        }
    });

    req.end();
};

workers.processCheckOutcome = (checkData, checkOutcome) => {

    const state = !checkOutcome.error && checkOutcome.responseCode && checkData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';
    const alert = checkData.lastChecked && checkData.state !== state ? true : false;

    const timeOfCheck = Date.now();
    workers.log(checkData, checkOutcome, state, alert, timeOfCheck);

    const newCheckData = checkData;
    newCheckData.state = state;
    newCheckData.lastChecked = Date.now();

    _data.update('checks', newCheckData.id, newCheckData, (err) => {
        if (!err) {
            if (alert) {
                workers.alertUserToStatusChange(newCheckData);
            }
            else {
                console.log('Stanje nije promenjeno');
            }
        } else {
            console.log('Greska prilikom azuriranja fajla');
        }
    });

}

workers.alertUserToStatusChange = (newCheckData) => {
    const msg = `Vas check za ${newCheckData.method.toUpperCase()} ${newCheckData.protocol}://${newCheckData.url} je ${newCheckData.state}`;
    helpers.sendTwilioSMS(newCheckData.userPhone, msg, (err) => {
        if (!err) {
            console.log('Korisnik je obavesten o promeni');
        } else {
            console.log('Nije moguce poslati SMS poruku korisniku');
        }
    });
};

workers.log = (checkData, checkOutcome, state, alert, timeOfCheck) => {
    const logData = {
        'check': checkData,
        'outcome': checkOutcome,
        'state': state,
        'alert': alert,
        'time': timeOfCheck
    };

    const logString = JSON.stringify(logData);

    const logFileName = checkData.id;

    _logs.append(logFileName, logString, (err) => {
        if (!err) {
            console.log('Uspelo je logovanje u fajl.');
        } else {
            console.log('Nije uspelo logovanje u fajl.');
        }
    });
};

workers.loop = () => {
    setInterval(() => {
        workers.gatherAllChecks();
    }, 1000 * 60);
};

workers.rotateLogs = () => {
    _logs.list(false, (err, logs) => {
        if (!err && logs && logs.length > 0) {

            logs.forEach(logName => {

                const logId = logName.replace('.log', '');
                const newFileId = `${logId}-${Date.now()}`;

                _logs.compress(logId, newFileId, (err) => {
                    if (!err) {

                        _logs.truncate(logId, (err) => {
                            if (!err) {
                                console.log('Uspesno smo kompresovali fajl');
                            } else {
                                console.log('Greska prilikom trankejtovanja fajla');
                            }
                        });

                    } else {
                        console.log('Greska prilikom kompresovanje ', err);
                    }
                });

            });

        } else {
            console.log('Nije moguce naci ni jedan nekompresovani log');
        }
    });
};

workers.logRotationLoop = () => {
    setInterval(() => {
        workers.rotateLogs();
    }, 1000 * 60 * 60 * 24);
};

workers.init = () => {

    workers.gatherAllChecks();

    workers.loop();

    workers.rotateLogs();

    workers.logRotationLoop();

};

module.exports = workers;