const server = require('./lib/server');
const workers = require('./lib/workers');

const app = {};

app.init = () => {

    //pokretanje servera
    server.init();
    
    //pokretanje worker-a
    workers.init();

}

app.init();

module.exports = app;