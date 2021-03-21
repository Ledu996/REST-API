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

lib.read = () => {

};

lib.update = () => {

};

lib.delete = () => {

};

module.exports = lib;