import { createApp } from 'vue'
import { createHead } from '@vueuse/head'
import * as firebase from "firebase/app";
import {getAuth, setPersistence, browserLocalPersistence} from 'firebase/auth'
import 'firebase/database'
import App from '@/App.vue'
import router from '@/router'
import authStore, { authStoreKey } from '@/stores/auth'
import databaseStore, { databaseStoreKey} from '@/stores/database'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faTrash, faToggleOff, faToggleOn, faCheck, faSpinner } from '@fortawesome/free-solid-svg-icons'
import BootstrapVue3 from 'bootstrap-vue-3'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-3/dist/bootstrap-vue-3.css'

library.add(faTrash, faToggleOn, faToggleOff, faCheck, faSpinner)


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAgdbA6JnfqG7pi_6albXxR35_isjXixVk",
  // authDomain: "crested-bloom-273314.firebaseapp.com",
  authDomain: "numacrawler.com",
  databaseURL: "https://crested-bloom-273314-default-rtdb.firebaseio.com",
  projectId: "crested-bloom-273314",
  storageBucket: "crested-bloom-273314.appspot.com",
  messagingSenderId: "369694241708",
  appId: "1:369694241708:web:9eca2cb0c5f26dc03ec009"
};

firebase.initializeApp(firebaseConfig);

import { getDatabase, connectDatabaseEmulator } from "firebase/database";

const db = getDatabase();
// if (location.hostname === "localhost") {
//   console.log("use database emulator")
//   // Point to the RTDB emulator running on localhost.
//   connectDatabaseEmulator(db, "localhost", 9000);
// } 

setPersistence(getAuth(), browserLocalPersistence)

const app = createApp(App)
const head = createHead()
app.component('font-awesome-icon', FontAwesomeIcon)
app.use(router)
app.use(BootstrapVue3)
app.use(head)
app.provide(authStoreKey, authStore())
app.provide(databaseStoreKey, databaseStore())
app.mount('#app')
