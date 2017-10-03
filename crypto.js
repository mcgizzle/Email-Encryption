var fs = require('fs');
var openpgp = require('openpgp');
var keys = {};
var passphrase = '1234';
keys.pubKeys = {}
keys.privKey = {}
var emails =[]
var decrypted_emails = []

fs.readFile('keys.json', function(err, content){
    if(err){
        console.log(err)
        return;
    }
    var input = JSON.parse(content);
    if(typeof input.privKey === "undefined"){
        generateKey();
    }
    else{
        console.log("KEYS LOADED")
        keys = input;
    }
});

function encryptM(info, callback){

    var privKeyObj = openpgp.key.readArmored(keys.privKey[me]).keys[0];
    privKeyObj.decrypt(passphrase);

    var options = {
        data: info.message,                             // input as String (or Uint8Array)
        privateKeys: privKeyObj // for signing
    };

    openpgp.sign(options).then(function(signed) {
        cleartext = signed.data; // '-----BEGIN PGP SIGNED MESSAGE ... END PGP SIGNATURE-----'
        var options = {
            data: cleartext,
            publicKeys: openpgp.key.readArmored(keys.pubKeys[info.to]).keys,
            privateKeys: privKeyObj
        };
        openpgp.encrypt(options).then(function(ciphertext) {
            info.encrypted = ciphertext.data;
            callback(info);
        });
    });

 }
 function decryptM(info,i){
    var privKeyObj = openpgp.key.readArmored(keys.privKey[me]).keys[0];
    privKeyObj.decrypt(passphrase);
    var options = {
        message: openpgp.message.readArmored(info.encrypted),     // parse armored message
        publicKeys: openpgp.key.readArmored(keys.pubKeys[info.from.text]).keys,    // for verification (optional)
        privateKey: privKeyObj // for decryption
    };

    openpgp.decrypt(options).then(function(plaintext) {
        options = {
            message: openpgp.cleartext.readArmored(plaintext.data), // parse armored message
            publicKeys: openpgp.key.readArmored(keys.pubKeys[info.from.text]).keys   // for verification
        };

        openpgp.verify(options).then(function(verified) {
            decrypted_emails[i]={"decrypted":verified.data,"subject":info.subject,"from":info.from.text};
        	validity = verified.signatures[0].valid;
        	if (validity) {
        		console.log('signed by key id ' + verified.signatures[0].keyid.toHex());
        	}
            return plaintext.data; // 'Hello, World!'
        });
    });
 }


function addPKey(key,email){
    if(!keys.pubKeys[email]){
        keys.pubKeys[email] = key;
    }
    else{
        console.log("KEY ALREADY EXISTS",email)
    }
    fs.writeFile('keys.json',JSON.stringify(keys), function(err){
        console.log("KEY ADDED TO FILE", email, keys.pubKeys[email])
    });
}
function removePKey(email){
    if(!keys.pubKeys[email]){
        console.log("KEY NOT FOUND",email)
        return;
    }
    delete keys.pubKeys[email];
    fs.writeFile('keys.json',JSON.stringify(keys), function(err){
        console.log("KEY REMOVED FROM FILE", email)
    });
}

module.exports = {
    getKey:             function getKey(email){
                            if(keys.pubKeys[email]){
                                return keys.pubKeys[email];
                            }
                            return false;
                        },
    addKey:             function addKey(email, key){
                            addPKey(key,email);
                        },
    removeKey:          function removeKey(email){
                            removePKey(email);
                        },
    encrypt:            function encrypt(info,c){
                            if(!keys.pubKeys[info.to]){
                                return false;
                            }
                            encryptM(info,c);
                            return true;
                            },
    decrypt:            function decrypt(m,i){
                            decryptM(m,i);
                        },
    getDecrypted:       function getDecrypted(i){
                            return decrypted_emails[i];
                        },
    checkPass:          function checkPass(p){
                            if(p != passphrase){
                                console.log("enetered: "+passphrase+" checked: "+this.passphrase)
                                return false;
                            }
                            return true;
                        },
    checkEmail:         function checkEmail(e){
                            if(keys.pubKeys[e]){
                                return true;
                            }
                            return false;
                        }

}

function generateKey(){
    console.log("GENERATING KEYS")
    var options = {
        userIds: [{ email:me }], // multiple user IDs
        numBits: 4096,                                            // RSA key size
        passphrase: passphrase         // protects the private key
    };
    openpgp.generateKey(options).then(function(key) {
        var privateKey = key.privateKeyArmored; // '-----BEGIN PGP PRIVATE KEY BLOCK ... '
        var publicKey = key.publicKeyArmored;   // '-----BEGIN PGP PUBLIC KEY BLOCK ... '
        keys.pubKeys[me] = publicKey;
        keys.privKey[me] = privateKey;
        fs.writeFile('keys.json',JSON.stringify(keys), function(err){
            console.log("KEYS WRITTEN TO FILE")
        });
    });


}
