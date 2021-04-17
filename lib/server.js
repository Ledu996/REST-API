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

        const choosenHandler = typeof server.router[trimmedPath] !== "undefined" ? server.router[trimmedPath] : handlers.notFound;

        const data = {
            trimmedPath: trimmedPath,
            queryStringObject: queryStringObject,
            method: method,
            headers: headers,
            payload: buffer
        };

        choosenHandler(data, (statusCode, payload) => {
            // osigurati da je status kod broj
            statusCode = typeof statusCode == 'number' ? statusCode : 200;
            // osigurati da je payload objekat
            payload = typeof payload == 'object' ? payload : {};

            const payloadString = JSON.stringify(payload);

            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            console.log('Response vraca ' + statusCode + " " + payloadString);
        });

    });
};

server.router = {
    'ping': handlers.ping,
    'users': handlers.users,
    'tokens': handlers.tokens,
    'checks': handlers.checks
};

server.init = () => {
    //pokretanje HTTP servera
    server.httpServer.listen(config.httpPort, () => {
        console.log(`Server je pokrenut na portu ${config.httpPort} i ime okruzenja je ${config.envName}`);
    });
    //pokretanje HTTPS servera
    server.httpsServer.listen(config.httpsPort, () => {
        console.log(`Server je pokrenut na portu ${config.httpsPort} i ime okruzenja je ${config.envName}`);
    });
};

module.exports = server;