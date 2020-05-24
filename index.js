var admin = require("firebase-admin");
var openpgp = require("openpgp"); // use as CommonJS, AMD, ES6 module or via window.openpgp

openpgp.initWorker({ path: "openpgp.worker.js" }); // set the relative web worker path

// Set Firebase Admin options
let serviceAccount = require("./fraser-votes-5da49fb5e231.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Generate Keys
let genKeys = (name, email) => {
  // Set Key Options
  var genOptions = {
    userIds: [{ name: name, email: email }], // multiple user IDs
    numBits: 4096, // RSA key size
  };

  let keys = openpgp.generateKey(genOptions).then(function (key) {
    var privkey = key.privateKeyArmored; // '-----BEGIN PGP PRIVATE KEY BLOCK ... '
    var pubkey = key.publicKeyArmored; // '-----BEGIN PGP PUBLIC KEY BLOCK ... '
    var revocationSignature = key.revocationSignature; // '-----BEGIN PGP PUBLIC KEY BLOCK ... '
    return { privkey, pubkey, revocationSignature };
  });

  return keys;
};

// Encrypt Data
let encrypt = async (plaintext, pubkey) => {
  // Encrypt a test string with public key
  const encOptions = {
    message: await openpgp.message.fromText(plaintext),
    publicKeys: (await openpgp.key.readArmored(pubkey)).keys,
  };

  let encrypted = await openpgp.encrypt(encOptions).then((ciphertext) => {
    return ciphertext.data;
  });

  return encrypted;
};

// Upload keys to server, print private key to console
// TODO: Implement

// Ask user for private key again
// TODO: Implement

// Decrypt Data
let decrypt = async (ciphertext, privkey) => {
  // Decrypt test string, check if it matches
  const decOptions = {
    message: await openpgp.message.readArmored(ciphertext),
    privateKeys: (await openpgp.key.readArmored(privkey)).keys,
  };

  let decrypted = await openpgp.decrypt(decOptions).then((plaintext) => {
    return plaintext.data;
  });

  return decrypted;
};

const testString = "Fraser Votes 2020";
genKeys("Jon Smith", "jon@example.com")
  .then((keys) => {
    // console.log(keys);
    return encrypt(testString, keys.pubkey).then((ciphertext) => {
      console.log(ciphertext);
      return decrypt(ciphertext, keys.privkey);
    });
  })
  .then((plaintext) => {
    console.log(plaintext);
    if (plaintext === testString) {
      console.log("Check Succeeded!");
    }
  });

console.log("DONE");
