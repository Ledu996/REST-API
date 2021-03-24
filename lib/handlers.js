const _data = require('./data');
const helpers = require('./helpers');

const handlers = {};

handlers.users = (data, callback) => {
    const acceptableMethods = ['get', 'post', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
};

handlers._users = {};

handlers._users.get = (data, callback) => {

};

// Ulazni podaci: ime, prezime, brojTelefona, lozinka i agreement
handlers._users.post = (data, callback) => {
    const firstName = typeof data.payload.firstName == "string" && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof data.payload.lastName == "string" && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const phone = typeof data.payload.phone == "string" && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
    const password = typeof data.payload.password == "string" && data.payload.password.trim().length >= 8 ? data.payload.password.trim() : false;
    const agreement = typeof data.payload.agreement == "boolean" && data.payload.agreement === true ? true : false;

    console.log(firstName);
    console.log(lastName);
    console.log(phone);
    console.log(password);
    console.log(agreement);
    
    if (firstName && lastName && phone && password && agreement) {

        _data.read('users', phone, (err, data) => {
            if (err) {
                //hesiranje lozinke
                const hashedPassword = helpers.hash(password);

                if (hashedPassword) {

                    const userObject = {
                        firstName: firstName,
                        lastName: lastName,
                        phone: phone,
                        hashedPassword: hashedPassword,
                        agreement: agreement
                    };

                    _data.create("users", phone, userObject, (err) => {
                        if (!err) {
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, { 'Error' : 'Nije uspelo kreiranje novog korisnika' });
                        }
                    });

                } else {
                    callback(500, { 'Error': 'Nije uspelo hesovanje lozinke' });
                }
            } else {
                callback(400, { 'Error': 'Korisnik sa tim brojem telefona vec postoji' })
            }
        });
    } else {
        callback(400, { 'Error': 'Nedostaju potrebna polja' });
    }
};

handlers._users.put = (data, callback) => {

};

handlers._users.delete = (data, callback) => {

};

handlers.ping = (data, callback) => {
    callback(200);
};

handlers.notFound = (data, callback) => {
    callback(404);
};

module.exports = handlers;