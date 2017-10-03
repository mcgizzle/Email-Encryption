var exec = require('child_process').exec;
var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var readline = require('readline');
var crypto = require('./crypto');
var auth = require('./auth.js');
const simpleParser = require('mailparser').simpleParser;

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
var secretlocation = "client_secret.json";
var emails = [];
var emailList = [];
var email_info = {}


module.exports = {
    send: function send(info){
            options = info;
            auth.authorize(cred,sendMessage)
    },
    getEmail: function getEmail(i){
        return emails[i];
    },
    refresh: function refresh(passphrase){
        auth.authorize(cred,messageList);
    }
}

function makeMail() {
    var str = ["Content-Type: text/plain; charset=\"UTF-8\"\n",
        "MIME-Version: 1.0\n",
        "Content-Transfer-Encoding: 7bit\n",
        "to: ", options.to, "\n",
        "from: sean\n",
        "subject: ", options.subject, "\n\n",
        options.encrypted
    ].join('');

    var encodedMail =  new Buffer(str).toString("base64").replace(/\+/g, '-').replace(/\//g, '_');
    return encodedMail;
}

function sendMessage(authen) {
    var mail = makeMail()
    var gmail = google.gmail('v1');
    gmail.users.messages.send({
        auth: authen,
        userId: 'me',
        resource: {
            raw: mail
        }
    }, function(err, response) {
        console.log(err || "Encrypted Email succesfully sent.")
        auth.authorize(cred,messageList);
    });
}

function getMessages(authen){
    var gmail = google.gmail('v1');
    emails = []
    var j=0;
    for(var i= 0; i<15;i++){
        gmail.users.messages.get({
            auth:authen,
            userId:'me',
            id:emailList.messages[i].id,
            format:'raw'},
            function(err, res){
                if(err){
                    console.log(err)
                }
                var buf = Buffer.from(res.raw, 'base64');
                emails.push(buf.toString());
                simpleParser(buf.toString(), (err, mail)=>{
                    var from = mail.from;
                    var subject = mail.subject;
                    if(crypto.checkEmail(mail.from.text)){
                        email_info[j] = {"encrypted":buf.toString(),"subject":subject,"from":from};
                        crypto.decrypt(email_info[j],j);
                        j++;
                    }
                });
        });
    }
    console.log("EMAILS LOADED")
}

function messageList(authen){
    var gmail = google.gmail('v1');
    gmail.users.messages.list({
        auth:authen,
        userId:'me'
    },
    function(err,res){
        emailList = res;
        auth.authorize(cred,getMessages);

    });
}

fs.readFile(secretlocation, function processClientSecrets(err, content) {
    if (err) {
        console.log("Error:",err)
        return;
    }
    cred = JSON.parse(content);
    auth.authorize(cred,messageList);
});
