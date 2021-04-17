const _data = require('./data');
const helpers = require('./helpers');
const config = require('../config');

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
        const token =  typeof data.headers.token == "string" ? data.headers.token : false;

        handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
            if (tokenIsValid) {
                _data.read('users', phone, (err, data) => {
                    if (!err && data) {
                        delete data.hashedPassword;
                        callback(200, data);
                    } else {
                        callback(404);
                    }
                });     
            } else {
                callback(403, {'Error': 'Nedostaje token u yaglavlju ili nije validan'});
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
    const phone = typeof paresedData.phone == "string" && paresedData.phone.trim().length === 10 ? paresedData.phone.trim() : false;
    const firstName = typeof paresedData.firstName == "string" && paresedData.firstName.trim().length > 0 ? paresedData.firstName.trim() : false;
    const lastName = typeof paresedData.lastName == "string" && paresedData.lastName.trim().length > 0 ? paresedData.lastName.trim() : false;
    const password = typeof paresedData.password == "string" && paresedData.password.trim().length >= 8 ? paresedData.password.trim() : false;
    
    if (phone) {
        if (firstName || lastName || password) {

            const token = typeof data.headers.token == "string" ? data.headers.token : false;

            handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
                if (tokenIsValid) {

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
                            callback(400,{ 'Error' :'Fajl koji pokusavamo da updajtujemo mozda ne postoji'});
                        }
                        });

                } else {
                    callback(403, {'Error' : 'Nedostaje token u yaglavlju ili nije validan'});
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

    if (phone) {
        //const token = typeof data.headers.token == "string" ? data.headers.token : false;
        const token = 't6t832lx7x4nfwjau7s5x'
        handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
            
            console.log(tokenIsValid, 'ovde je false');
            
            if (tokenIsValid) {
                
                _data.read('users', phone, (err, data)=>{
                    if(!err && data){
                         _data.delete('users', phone, (err)=>{
                            if(err){
                                callback(500, {'Error' : 'Greska prilikom brisanja fajla'});
                            }else{
                                callback(200);
                            }
                        });   
                                                                       
                }else{
                    callback(400,{'Error':'Operacija nije uspela, ime fajla koji ste uneli ne postoji'});
                }
            });

        }else{
                callback(403, {'Error' : 'Token ne postoji u yaglavlju ili nije validan'})
            }
        });

    } else {
        callback(400, {'Error' : 'Nedostaje broj telefona'});
    }
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
    console.log(id, phone)
    _data.read('tokens', id, (err, tokenData) => {
        if (!err && tokenData) {
            console.log(tokenData, tokenData.phone == phone, tokenData.expires > Date.now());
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

// Cheks
handlers.checks = (data, callback) => {
    const acceptableMethods = ['get', 'post', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._checks[data.method](data, callback);
    } else {
        callback(405);
    }
};

handlers._checks = {};

// podaci: protocol, url, method, successCodes, timeoutSeconds
handlers._checks.post = (data, callback) => {
    console.log(data);
    const parsedData = JSON.parse(data.payload);
    console.log(parsedData);
    const protocol = typeof parsedData.protocol == 'string' && ['http', 'https'].indexOf(parsedData.protocol) > -1 ? parsedData.protocol : false;
    const url = typeof parsedData.url == 'string' && parsedData.url.trim().length > 0 ? parsedData.url.trim() : false;
    const method = typeof parsedData.method == 'string' && ['post', 'get', 'put', 'delete'].indexOf(parsedData.method) > -1 ? parsedData.method : false;
    const successCodes = typeof parsedData.successCodes == 'object' && parsedData.successCodes instanceof Array && parsedData.successCodes.length > 0 ? parsedData.successCodes : false;
    const timeoutSecond = typeof parsedData.timeoutSecond == 'number' && parsedData.timeoutSecond % 1 === 0 && parsedData.timeoutSecond >= 1 && parsedData.timeoutSecond <= 5 ? parsedData.timeoutSecond : false;

    console.log(protocol, url, method, successCodes, timeoutSecond);
    if (protocol && url && method && successCodes && timeoutSecond) {

        const token = "ktqkdg5l0jom4sx77xehx";
        //typeof data.headers.token === 'string' ? data.headers.token : false;

        _data.read('tokens', token, (err, tokenData) => {
            if (!err && tokenData) {

                const userPhone = tokenData.phone;

                _data.read('users', userPhone, (err, userData) => {
                    if (!err && userData) {

                        const userChecks = typeof userData.checks == 'object' && userData.checks instanceof Array ? userData.checks : [];
                        if (userChecks.length < config.maxChecks) {
                            
                            const checkId = helpers.createRandomString(20);

                            const checkObject = {
                                'id': checkId,
                                'userPhone': userPhone,
                                'protocol': protocol,
                                'url': url,
                                'method': method,
                                'successCodes': successCodes,
                                'timeoutSecond' : timeoutSecond
                            };

                            _data.create('checks', checkId, checkObject, (err) => {
                                if (!err) {

                                    userData.checks = userChecks;
                                    userData.checks.push(checkId);

                                    _data.update('users', userPhone, userData, (err) => {
                                        if (!err) {
                                            callback(200, checkObject);
                                        } else {
                                            callback(500, {'error': 'Nije moguce dodati novi check korisniku'});
                                        }
                                    });

                                } else {
                                    callback(500, {'Error' : 'Nije moguce kreirati novi check'});
                                }
                            });

                        } else {
                            callback(400, {'Error' : 'Korisnik vec ima makismalan broj checkove'});
                        }
                    } else {
                        callback(400, {'Error': 'Ne postoji korisnik'});
                    }
                });

            } else {
                callback(400, {'Error' : 'Ne postoji token'});
            }
        });

    } else {
        callback(400, {'Error' : 'Niste uneli ispravne podatke'});
    }
};

handlers._checks.get = (data, callback) => {
    const id = typeof data.queryStringObject.id == 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false;

    if (id) {

        _data.read('checks', id, (err, checkData) => {
            if (!err && checkData) {

                const token = data.headers.token == 'string' ? data.headers.token : false;
                console.log('podaci od checka:' + checkData);

                handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
                    if (tokenIsValid) {
                        callback(200, checkData);
                    } else {
                        callback(403);
                    }
                });

            } else {
                callback(404);
            }
        });

    } else {
        callback(400, {'Error' : 'Nedostaje id'});
    }
};

handlers._checks.put = (data, callback) => {
    // obavezan podatak
    const id = typeof data.queryStringObject.id == 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false;
    // opcioni podaci
    const protocol = typeof data.payload.protocol == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    const url = typeof data.payload.url == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    const method = typeof data.payload.method == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    const successCodes = typeof data.payload.successCodes == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    const timeoutSeconds = typeof data.payload.timeoutSecond == 'number' && data.payload.timeoutSecond % 1 === 0 && data.payload.timeoutSecond >= 1 && data.payload.timeoutSecond <= 5 ? data.payload.timeoutSecond : false;

    if (id) {

        if (protocol || url || method || successCodes || timeoutSecond) {

            _data.read('checks', id, (err, checkData) => {
                if (!err && checkData) {

                    const token = typeof data.headers.token == 'string' ? data.headers.token : false;

                    handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
                        if (tokenIsValid) {

                            if (protocol) {
                                checkData.protocol = protocol;
                            }
                            if (url) {
                                checkData.url = url;
                            }
                            if (method) {
                                checkData.method = method;
                            }
                            if (successCodes) {
                                checkData.successCodes = successCodes;
                            }
                            if (timeoutSecond) {
                                checkData.timeoutSeconds = timeoutSecond;
                            }

                            _data.update('checks', id, checkData, (err) => {
                                if (!err) {
                                    callback(200);
                                } else {
                                    callback(500, {'Error' : 'Nije moguce azurirari check'});
                                }
                            });

                        } else {
                            callback(403);
                        }
                    });

                } else {
                    callback(400, {'Error' : 'Id ne postoji'});
                }
            });

        } else {
            callback(400, {'Error': 'Nedostaju podaci za update'});
        }

    } else {
        callback(400, {'Error' : 'Nedostaje id'});
    }
};

handlers._checks.delete = (data, callback) => {
    const id = typeof data.queryStringObject.id == 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false;

    if (id) {

        _data.read('ckecks', id, (err, checkData) => {
            if (!err && checkData) {

                const token = typeof data.headers.token == 'string' ? data.headers.token : false;
                handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
                    if (tokenIsValid) {

                        _data.delete('checks', id, (err) => {
                            if (!err) {

                                _data.read('users', checkData.userPhone, (err, userData) => {
                                    if (!err && userData) {

                                        const userChecks = typeof userData.checks == 'object' && userData.checks instanceof Array ? userData.checks : [];
                                        const checkPosition = userChecks.indexOf(id);
                                        if (checkPosition > -1) {
                                            userChecks.splice(checkPosition, 1);
                                            userData.checks = userChecks;

                                            _data.update('users', checkData.userPhone, userData, (err) => {
                                                if (!err) {
                                                    callback(200);
                                                } else {
                                                    callback(500, {'Error' : 'Nije moguce azurariti korisnika'});
                                                }
                                            });
                                        } else {
                                            callback(500, {'Error': 'Nije moguce pronaci check kod korisnika'});
                                        }

                                    } else {
                                        callback(500, {'Error' : 'Nije moguce pronaci kreatora checka'});
                                    }
                                });

                            } else {
                                callback(500, {'Error' : 'Nije moguce obrisati check'});
                            }
                        });

                    } else {
                        callback(403);
                    }
                });

            } else {
                callback(400, {'Error' : 'Ne postoji check sa tim id-jem'});
            }
        });

    } else {
        callback(400, {'Error' : 'Nedostaje id'});
    }
};

handlers.ping = (data, callback) => {
    callback(200);
};

handlers.notFound = (data, callback) => {
    callback(404);
};

module.exports = handlers;