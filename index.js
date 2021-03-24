// Zavisisnosti
const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const _data = require('./lib/data');
const handlers = require('./lib/handlers');

const server = http.createServer((req, res) => {
    
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

        const choosenHandler = typeof router[trimmedPath] !== "undefined" ? router[trimmedPath] : handlers.notFound;

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
});

server.listen(config.port, () => {
    console.log(`Server je pokrenut na portu ${config.port} i ime okruzenja je ${config.envName}`);
});

const router = {
    'ping': handlers.ping,
    'users': handlers.users
}