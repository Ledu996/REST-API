// Zavisisnosti
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('../config');
const handlers = require('./handlers');
const helpers = require('./helpers');
const fs = require('fs');
const path = require('path');
const util = require('util');
const debug = util.debuglog('server');

const server = {};

/*helpers.sendTwilioSMS('5005550333', 'Hello World!', (err) => {
    console.log('Greska je ovo: ' + err);
});*/

server.httpServer = http.createServer((req, res) => {
    server.unifiedServer(req, res);
});

server.httpsServerOptions = {
    'key': fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
};

server.httpsServer = https.createServer(server.httpsServerOptions, (req, res) => {
    unifiedServer(req, res);
});

server.unifiedServer = (req, res) => {
    const parsedURL = url.parse(req.url, true);

    const path = parsedURL.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');

    const method = req.method.toLocaleLowerCase();

    const queryStringObject = parsedURL.query;

    const headers = req.headers;

    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', (data) => {
        buffer += decoder.write(data);
    });
    req.on('end', () => {
        buffer += decoder.end();

        let choosenHandler = typeof server.router[trimmedPath] !== "undefined" ? server.router[trimmedPath] : handlers.notFound;

        choosenHandler = trimmedPath.indexOf('public/') > -1 ? handlers.public : choosenHandler;

        const data = {
            trimmedPath: trimmedPath,
            queryStringObject: queryStringObject,
            method: method,
            headers: headers,
            payload: buffer
        };

        choosenHandler(data, (statusCode, payload, contentType) => {

            contentType = typeof contentType == 'string' ? contentType : 'json';
            
            statusCode = typeof statusCode == 'number' ? statusCode : 200;

            let payloadString = '';

            if (contentType == 'json') {
                res.setHeader('Content-Type', 'application/json');
                payload = typeof payload == 'object' ? payload : {};
                payloadString = JSON.stringify(payload);
            }

            if (contentType == 'html') {
                res.setHeader('Content-Type', 'text/html');
                payloadString = typeof payload == 'string' ? payload : '';
            }

            if (contentType == 'favicon') {
                res.setHeader('Content-Type', 'image/x-icon');
                payloadString = typeof payload !== 'undefined' ? payload : '';
            }

            if (contentType == 'plain') {
                res.setHeader('Content-Type', 'text/plain');
                payloadString = typeof payload !== 'undefined' ? payload : '';
            }

            if (contentType == 'css') {
                res.setHeader('Content-Type', 'text/css');
                payloadString = typeof payload !== 'undefined' ? payload : '';
            }

            if (contentType == 'png') {
                res.setHeader('Content-Type', 'image/png');
                payloadString = typeof payload !== 'undefined' ? payload : '';
            }

            if (contentType == 'jpg') {
                res.setHeader('Content-Type', 'image/jpeg');
                payloadString = typeof payload !== 'undefined' ? payload : '';
            }

            res.writeHead(statusCode);
            res.end(payloadString);

            if (statusCode == 200) {
                debug('\x1b[32m%s\x1b[0m', method.toUpperCase() + ' /' + trimmedPath + ' ' + statusCode);
            } else {
                debug('\x1b[31m%s\x1b[0m', method.toUpperCase() + ' /' + trimmedPath + ' ' + statusCode);
            }
        });

    });
};

server.router = {
    '' : handlers.index,
    'account/create' : handlers.accountCreate, //registracija
    'account/edit' : handlers.accountEdit, // isti kao reg
    'account/deleted' : handlers.accountDeleted, // poruka izbrosali ste account
    'session/create' : handlers.sessionCreate, // redirect checks all ()
    'session/deleted' : handlers.sessionDeleted,
    'checks/all' : handlers.checksList, // lista svih cekova(dugme za check i delete)
    'checks/create' : handlers.checksCreate, // forma sa svim podacima vezani za chekove
    'checks/edit' : handlers.checksEdit, 
    'ping': handlers.ping,
    'api/users': handlers.users,
    'api/tokens': handlers.tokens,
    'api/checks': handlers.checks,
    'favicon.ico': handlers.favicon,
    'public': handlers.public
};

server.init = () => {
    //pokretanje HTTP servera
    server.httpServer.listen(config.httpPort, () => {
        console.log('\x1b[36m%s\x1b[0m', `Server je pokrenut na portu ${config.httpPort} i ime okruzenja je ${config.envName}`);
    });
    //pokretanje HTTPS servera
    server.httpsServer.listen(config.httpsPort, () => {
        console.log('\x1b[35m%s\x1b[0m', `Server je pokrenut na portu ${config.httpsPort} i ime okruzenja je ${config.envName}`);
    });
};

module.exports = server;