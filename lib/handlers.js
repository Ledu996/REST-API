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
    const phone = typeof data.queryStringObject.phone == "string" && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;
    
    if (phone) {
        _data.read('users', phone, (err, data) => {
            if (!err && data) {
                delete data.hashedPassword;
                callback(200, data);
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, {'Error' : 'Fali broj telefona ili nije validan'});
    }
};

// Ulazni podaci: ime, prezime, brojTelefona, lozinka i agreement
handlers._users.post = (data, callback) => {
    //data je string zato ne moze da prisusvuje propertijima
    //console.log(data);
    //console.log(typeof data.payload);
    const paresedData=JSON.parse(data.payload);
    const firstName = typeof paresedData.firstName == "string" && paresedData.firstName.trim().length > 0 ? paresedData.firstName.trim() : false;
    const lastName = typeof paresedData.lastName == "string" && paresedData.lastName.trim().length > 0 ? paresedData.lastName.trim() : false;
    const phone = typeof paresedData.phone == "string" && paresedData.phone.trim().length === 10 ? paresedData.phone.trim() : false;
    const password = typeof paresedData.password == "string" && paresedData.password.trim().length >= 8 ? paresedData.password.trim() : false;
    const agreement = typeof paresedData.agreement == "boolean" && paresedData.agreement === true ? true : false;  
    
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

handlers._users.put = (data, callback) => {//Zavrsi ovo i pogledaj kako je odradjeno u projektu za post
    console.log(data.payload)
    let paresedData = JSON.parse(data.payload);
    const firstName = typeof paresedData.firstName == "string" && paresedData.firstName.trim().length > 0 ? paresedData.firstName.trim() : false;
    const lastName = typeof paresedData.lastName == "string" && paresedData.lastName.trim().length > 0 ? paresedData.lastName.trim() : false;
    const password = typeof paresedData.password == "string" && paresedData.password.trim().length >= 8 ? paresedData.password.trim() : false;
    
    if (phone) {
        if (firstName || lastName || password) {

            _data.read('users', phone, (err, userData) => {
                if (!err && userData) {
                    //hesiranje lozinke
                    //const hashedPassword = helpers.hash(password);
    
                    if (firstName) {
                        userData.firstName = firstName;
                    }
    
                    if (lastName) {
                        userData.lastName = lastName;
                    }
    
                    if (password) {
                        userData.hashedPassword = helpers.hash(password);
                    }
    
                    _data.update('users', phone, userData, (err) => {
                        if (!err) {
                            callback(200);
                        } else {
                            callback(500, {'Error' : 'Nije uspelo azuriranje fajla'});
                        }
                    });
                } else{
                    callback(500,{ 'Error' :'Fajl koji pokusavamo da updajtujemo mozda ne postoji'});
                }
                });
            } else{
            callback(400,{'Error':'Nedostaju sva polja'});
        }               
    
    } else {
        callback(400, {'Error' : 'Broj telefona nije validan ili ne postoji'});
    }    
};

handlers._users.delete = (data, callback) => {
    const phone = typeof data.queryStringObject.phone == "string" && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;

        _data.read('users',phone,(err, data)=>{
            if(!err && data){
                _data.delete('users',phone,(err)=>{
                if(err){
                    callback(500, {'Error' : 'Greska prilikom brisanja fajla'});
                }else{
                    callback(200);
                }
            })
        }else{
            callback(400,{'Error':'Operacija nije uspela, ime fajla koji ste uneli ne postoji'});
        }
    });
};

handlers.tokens = (data, callback) => {
    const acceptableMethods = ['get', 'post', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
};

handlers._tokens = {};

handlers._tokens.post = (data, callback) => {
    console.log('data: ' + data);
    const paresedData = JSON.parse(data.payload);
    const phone = typeof paresedData.phone == "string" && paresedData.phone.trim().length === 10 ? paresedData.phone.trim() : false;
    const password = typeof paresedData.password == "string" && paresedData.password.trim().length >= 8 ? paresedData.password.trim() : false;
    console.log(phone);
    console.log(password);
    if (phone && password) {
        _data.read('users', phone, (err, userData) => {
            if (!err && userData) {
                const hashedPassword = helpers.hash(password);
                if (hashedPassword === userData.hashedPassword) {
                    const tokenId = helpers.createRandomString(20);
                    const expires = Date.now() + 1000 * 60 * 60;
                    const tokenObject = {
                        'phone': phone,
                        'id': tokenId,
                        'expires': expires
                    };

                    _data.create('tokens', tokenId, tokenObject, (err) => {
                        if (!err) {
                            callback(200, tokenObject);
                        } else {
                            callback(500, {'Error' : 'Nije uspelo kreiranje fajla'});
                        }
                    });
                } else {
                    callback(400, {'Error' : "Lozinka se ne poklapa"});
                }
            } else {
                callback(404, {'Error' : "Korisnik ne postoji"});
            }
        });
    } else {
        callback(400, {'Error' : 'fale obavezna polja'});
    }
};

handlers._tokens.get = (data, callback) => {
    const id = typeof data.queryStringObject.id == 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                callback(200, tokenData);
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, {'Error' : 'Id nedostaje ili nije validan'});
    }
};

handlers._tokens.put = (data, callback) => {
    const id = typeof data.queryStringObject.id == 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false;
    const extend = typeof data.payload.extend == 'boolean' && data.payload.extend === true ? true : false;
    if (id && extend) {
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                if (tokenData.expires > Date.now()) {
                    tokenData.expires = Date.now() + 1000 * 60 *60;
                    _data.update('tokens', id, tokenData, (err) => {
                        if (!err) {
                            callback(200);
                        } else {
                            callback(500, {'Error' : 'Nije moguce produziti rok tokena'});
                        }
                    });
                } else {
                    callback(400, {'Error': 'Token je vec istekao'});
                }
            } else {
                callback(400, {'Error' : 'Ovaj token ne postoji'});
            }
        })
    } else {
        callback(400, {'Error' : 'Nedostaju odgovarajuci podaci'});
    }
};

handlers._tokens.delete = (data, callback) => {
    const id = typeof data.queryStringObject.id == 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                _data.delete('tokens', id, (err) => {
                    if (!err) {
                        callback(200);
                    } else {
                        callback(500, {'Error' : 'Nije moguce obrisati token'});
                    }
                });
            } else {
                callback(400, {'Error' : 'Nije moguce promani token'});
            }
        });
    } else {
        callback(400, {'Error' : 'Nedoistaje id'});
    }
};

handlers._tokens.verifyToken = (id, phone, callback) => {
    _data.read('tokens', id, (err, tokenData) => {
        if (!err && tokenData) {
            if (tokenData.phone == phone && tokenData.expires > Date.now()){
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};

handlers.ping = (data, callback) => {
    callback(200);
};

handlers.notFound = (data, callback) => {
    callback(404);
};

module.exports = handlers;