const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();
console.log(process.env.DB_PASS);
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

const serviceAccount = require("./configs/burj-al-arab-65a1e-firebase-adminsdk-tlhh8-0de699932e.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIRE_DB
});


const MongoClient = require('mongodb').MongoClient;

const uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0-shard-00-00.dvdk4.mongodb.net:27017,cluster0-shard-00-01.dvdk4.mongodb.net:27017,cluster0-shard-00-02.dvdk4.mongodb.net:27017/burjAlArab?ssl=true&replicaSet=atlas-fm7zfh-shard-0&authSource=admin&retryWrites=true&w=majority`;

MongoClient.connect(uri, { useNewUrlParser: true , useUnifiedTopology: true } ,  function(err, client) {
  const bookings = client.db("burjAlArab").collection("bookings");

  app.post('/addBooking' , (req , res) => {
      const newBooking = req.body;
      bookings.insertOne(newBooking)
      .then(result => {
          res.send(result.insertedCount > 0)
      })
      console.log(newBooking);
  })

  app.get('/bookings' , (req , res) => {
    const bearer = req.headers.authorization
    if(bearer && bearer.startsWith('Bearer ')){
        const idToken = bearer.split(' ')[1];
        // idToken comes from the client app
        admin.auth().verifyIdToken(idToken)
            .then(function(decodedToken) {
                const tokenEmail = decodedToken.email;
                const queryEmail = req.query.email;
                if(tokenEmail == queryEmail){
                    bookings.find({email: queryEmail})
                        .toArray((err , documents) => {
                        res.status(200).send(documents);
                    })
                }
                else{
                    res.status(401).send('Un Authorized Excess');
                }
            }).catch(function(error) {
                res.status(401).send('Un Authorized Excess');
        });
    }
    else {
        res.status(401).send('Un Authorized Excess');
    }
  })
});


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port)