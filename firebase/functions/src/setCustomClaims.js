const admin = require('firebase-admin');

const serviceAccount = require('../../crested-bloom-273314-firebase-adminsdk-dn3rz-31645dde2e');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAgdbA6JnfqG7pi_6albXxR35_isjXixVk",
  // authDomain: "crested-bloom-273314.firebaseapp.com",
  authDomain: "numacrawler.com",
  databaseURL: "https://crested-bloom-273314-default-rtdb.firebaseio.com",
  projectId: "crested-bloom-273314",
  storageBucket: "crested-bloom-273314.appspot.com",
  messagingSenderId: "369694241708",
  appId: "1:369694241708:web:9eca2cb0c5f26dc03ec009",
  credential: admin.credential.cert(serviceAccount)
};

admin.initializeApp(firebaseConfig);

// const uid = "o2Egv7hM6CeglQTsRQ7v9O95wkO2";
const uid = "2q71wBMcK9XgF0PVn4BMRSiRx0s1";

// admin.auth().setCustomUserClaims(uid, { admin: true, user: true }).then(() => {
//     console.log("set customClaim");
// })

admin.auth().getUser("o2Egv7hM6CeglQTsRQ7v9O95wkO2").then(
  (user) =>{
        console.log(JSON.stringify(user.customClaims))
  }
)
