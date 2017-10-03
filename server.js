var http = require('http');
var fs = require('fs');
var formidable = require("formidable");
var util = require('util');
var app = require('./app.js');
var crypto = require('./crypto.js');

var server = http.createServer(function (req, res) {
    if (req.method.toLowerCase() == 'get') {
        displayStart(res);
    } else if (req.method.toLowerCase() == 'post') {
        processFormFieldsIndividual(req, res);
    }

});

function displayStart(res,option) {
    fs.readFile('form.html', function (err, data) {
        res.writeHead(200, {
            'Content-Type': 'text/html'
        });
        res.write(data);
        switch(option){
            case 1: res.end('<script> alert("Mail successfully sent.");</script>')
            break;
            case 2: res.end('<script> alert("Error sending message. Please try again.");</script>');
            break;
            case 3: var i =0;
                    while(typeof crypto.getDecrypted(i) !== "undefined"){
                        var email = crypto.getDecrypted(i);
                        res.write('<h4> From: '+email.from+'</h4>'+'<h4> Subject: '+email.subject+'</h4>'+'<p>DECRYPTED MESSAGE: '+email.decrypted+'</p><br>');
                        i++;
                    }
                    res.end();
            break;
            case 4: res.end('<script> alert("Error!! Incorrect passphrase");</script>');
            break;
            case 5: res.end('<script> alert("Successfully added member");</script>');
            break;
            case 6: res.end('<script> alert("Successfully removed memeber");</script>');
            break;
            default: res.end()
        }
        res.end();
    });
}

function processFormFieldsIndividual(req, res) {
    var fields = [];
    var form = new formidable.IncomingForm();
    form.on('field', function (field, value) {
        fields[field] = value;
    });

    form.on('end', function () {
            console.log("Form ["+fields.f+"]")
        switch(fields.f){
            case "email":
            if(crypto.encrypt(fields,app.send)){
                displayStart(res,1);
            }
            else{
                displayStart(res,2);
            }
            break;
            case "add": crypto.addKey(fields.email,fields.publickey);
                        displayStart(res,5);
            break;
            case "remove": crypto.removeKey(fields.email);
                            displayStart(res,6);
            break;
            case "refresh": if(!crypto.checkPass(fields.passphrase)){
                                displayStart(res,4)
                                return;
                            }
                            app.refresh();
                            displayStart(res,3);
            break;
            default: console.log("UNKNOWN FORM: ",fields);
        }

    });
    form.parse(req);
}


server.listen(2000);
console.log("server listening on 2000");
