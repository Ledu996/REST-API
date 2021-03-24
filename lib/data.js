const fs = require('fs');
const path = require('path');

const lib = {};

lib.baseDir = path.join(__dirname, '/../.data/');

lib.create = (dir, file, data, callback) => {
    fs.open(`${lib.baseDir}${dir}/${file}.json`, 'wx', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            const stringData = JSON.stringify(data);

            fs.writeFile(fileDescriptor, stringData, (err) => {
                if (!err) {
                    fs.close(fileDescriptor, (err) => {
                        if (!err) {
                            callback(false);
                        } else {
                            callback('Greska prilikom zatvaranja fajla.');
                        }
                    });
                } else {
                    callback('Greska prilikom upisa u novi fajl.');
                }
            });
        } else {
            callback('Ne mozete kreirati novi fajl, mozda vec postoji.');
        }
    });
};

lib.read = (dir, file, callback) => {
    fs.readFile(`${lib.baseDir}${dir}/${file}.json`, 'utf-8', (err, data) => {
        if (!err && data) {
            callback(false, data);
        } else {
            callback(err, data);
        }
    });
};

lib.update = (dir, file, data, callback) => {
    fs.open(`${lib.baseDir}${dir}/${file}.json`, 'r+', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            const stringData = JSON.stringify(data);

            fs.truncate(fileDescriptor, (err) => {
                if (!err) {
                    fs.writeFile(fileDescriptor, stringData, (err) => {
                        if (!err) {
                            fs.close(fileDescriptor, (err) => {
                                if (!err) {
                                    callback(false);
                                } else {
                                    callback('Greska prilikom zatvaranja fajla.');
                                }
                            });
                        } else {
                            callback('Greska prilikom upisivanja u fajl.');
                        }
                    });
                } else {
                    callback('Greska prilikom trunketovanja.');
                }
            })
        } else {
            callback('Nije moguce otvoriti fajl, verovatno ne postoji');
        }
    });
};

lib.delete = (dir, file, callback) => {
    fs.unlink(`${lib.baseDir}${dir}/${file}.json`, (err) => {
        if (!err) {
            callback(false);
        } else {
            callback('Greska prilikom brisanja fajla');
        }
    });
};

module.exports = lib;