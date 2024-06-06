const firebaseadmin = require("firebase-admin")
const serviceAccount = require('../serviceAccountKey.json');


let admin=
firebaseadmin.initializeApp({
    credential: firebaseadmin.credential.cert(serviceAccount)
})

module.exports={
    admin
}