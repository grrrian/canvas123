import firebase from 'firebase'
var config = {
    apiKey: "AIzaSyCN6fFELat1QXE5Urm5xzPdTy6WSEEv7qs",
    authDomain: "tilesbyjoe.firebaseapp.com",
    databaseURL: "https://tilesbyjoe.firebaseio.com",
    projectId: "tilesbyjoe",
    storageBucket: "tilesbyjoe.appspot.com",
    messagingSenderId: "955373425356"
};
var fire = firebase.initializeApp(config);
export default fire;