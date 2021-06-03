const app = {};

app.config = {
    'sessionToken' : false
}

app.client = {};

app.client.request = (headers, path, method, queryStringObject, payload, callback) => {
    headers = typeof headers == 'object' && headers !== null ? headers : {};
    path = typeof path == 'string' ? path : '/';
    method = typeof method == 'string' && ['POST', 'GET', 'PUT', 'DELETE'].indexOf(method.toUpperCase()) > -1 ? method.toUpperCase() : 'GET';
    queryStringObject = typeof queryStringObject == 'object' && queryStringObject !== null ? queryStringObject : {};
    payload = typeof payload == 'object' && payload !== null ? payload : {};
    callback = typeof callback == 'function' ? callback : false;
    
    let requestUrl = `${path}?`;
    let counter = 0;
    for (let queryKey in queryStringObject) {
        if (queryStringObject.hasOwnProperty(queryKey)) {
            counter++;

            if (counter > 1) {
                requestUrl += '&';
            }

            requestUrl += queryKey + '=' + queryStringObject[queryKey];
        }
    }

    const xhr = new XMLHttpRequest();
    xhr.open(method, requestUrl, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    for (let headerKey in headers) {
        if (headers.hasOwnProperty(headerKey)) {
            xhr.setRequestHeader(headerKey, headers[headerKey]);
        }
    }

    if (app.config.sessionToken) {
        xhr.setRequestHeader('token', app.config.sessionToken.id);
    }

    xhr.onreadystatechange = () => {
        if (xhr.readyState == XMLHttpRequest.DONE) {
            const statusCode = xhr.status;
            const responseText = xhr.responseText;

            if (callback) {
                try {
                    const parsedResponse = JSON.parse(responseText);
                    callback(statusCode, parsedResponse);
                } catch (e) {
                    callback(statusCode, false);
                }
            }
        }
    }

    const payloadString = JSON.stringify(payload);
    xhr.send(payloadString);
};

app.bindForms = function() {
    document.querySelector("form").addEventListener("submit", function(e) {

        e.preventDefault();
        var formId = this.id;
        var path = this.action;
        var method = this.method.toUpperCase();

        document.getElementsByClassName('formError')[0].style.display = 'hidden';

        var payload = {};
        var elements = this.elements;
        for (var i = 0; i < elements.length; i++) {
            if (elements[i].type !== 'submit') {
                var valueOfElement = elements[i].type == 'checkbox' ? elements[i].checked : elements[i].value;
                payload[elements[i].name] = valueOfElement;
            }
        }

        // Call the API
        app.client.request(undefined, path, method, undefined, payload, function(statusCode, responsePayload) {
            if (statusCode !== 200) {
                var error = typeof(responsePayload.Error) == 'string' ? responsePayload.Error : 'An error has occured, please try again later.';

                document.getElementsByClassName('formError')[0].innerHTML = error;

                document.getElementsByClassName('formError')[0].style.display = 'block';
            } else {
                app.formResponseProcessor(formId, payload, responsePayload);
            }
        });

    });
};

app.formResponseProcessor = function(formId, requestPayload, responsePayload) {

    if (formId == 'signup') {

        var newPayload = {
            'phone': requestPayload.phone,
            'password': requestPayload.password
        };

        app.client.request(undefined, 'api/tokens', 'POST', undefined, newPayload, function(newStatusCode, newResponsePayload) {
            if (newStatusCode !== 200) {

                document.getElementsByClassName('formError')[0].innerHTML = 'Sorry, an error has occured. Please try again.';
                document.getElementsByClassName('formError')[0].style.display = 'block';

            } else {
                app.setSessionToken(newResponsePayload);
                window.location = '/checks/all';
            }
        });
    }

    if (formId == 'signin') {
        app.setSessionToken(newResponsePayload);
        window.location = '/checks/all';
    }

};

app.setSessionToken = function(token) {
    app.config.sessionToken = token;
    var tokenString = JSON.stringify(token);
    localStorage.setItem('token', tokenString);
    if (typeof token == 'object') {
        app.setLoggedInClass(true);
    } else {
        app.setLoggedInClass(false);
    }
}

app.getSessionToken = function() {
    var tokenString = localStorage.getItem('token');
    if (typeof tokenString == 'string') {
        try {
            var token = JSON.parse(tokenString);
            app.config.sessionToken = token;
            if (typeof token == 'object') {
                app.setLoggedInClass(true);
            } else {
                app.setLoggedInClass(false);
            }
        } catch (e) {
            app.config.sessionToken = false;
            app.setLoggedInClass(false);
        }
    }
}

app.setLoggedInClass = function(add) {
    var target = document.querySelector("body");
    if (add) {
        target.classList.add('loggedIn');
    } else {
        target.classList.remove("loggedIn");
    }
}

app.renewToken = function(callback) {
    var currentToken = typeof app.config.sessionToken == 'object' ? app.config.sessionToken : false;
    if (currentToken) {

        var payload = {
            'id': currentToken.id,
            'extend': true
        };

        app.client.request(undefined, 'api/tokens', 'PUT', undefined, payload, function(statusCode, responsePayload) {

            if (statusCode == 200) {

                var queryStringObject = { 'id' : currentToken.id };

                app.client.request(undefined, 'api/tokens', 'GET', queryStringObject, undefined, function(statusCode, responsePayload) {

                    if (statusCode == 200) {
                        app.setSessionToken(responsePayload);
                        callback(false);
                    } else {
                        app.setSessionToken(false);
                        callback(true);
                    }

                });

            } else {
                app.setSessionToken(false);
                callback(true);
            }

        });

    } else {
        app.setSessionToken(false);
        callback(true);
    }
}

app.tokenRenewalLoop = function() {
    setInterval(function() {
        app.renewToken(function(err){
            if (!err) {
                console.log('Token renewed successfully ' + Date.now());
            }
        });
    }, 1000 * 60);
}

app.init = function() {
    app.bindForms();

    app.getSessionToken();

    app.tokenRenewalLoop();
};

window.onload = function() {
    app.init();
};