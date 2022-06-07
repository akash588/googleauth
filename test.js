// app.js (or index.js)
const express = require('express')
const app = express()
const port = 3000

app.listen(port, () => console.log('Example app listening on port ' + port))

// This line of code is for printing Hello World! in the browser,
// when you enter in the browser url bar: http://localhost:3000/
app.get('/', (req, res) => res.send('Hello World!'))

// This variable is populated in the findDocuments function (see below "Using Mongo")
var mongoDocsToDisplay = null;

// This line of code will print the collection's documents in the browser,
// when you enter in the browser url bar: http://localhost:3000/mongo
app.get('/mongo', (req, res) => res.send(
    mongoDocsToDisplay
));

// Using MongoDB:

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const url = 'mongodb://127.0.0.1:27017';

const dbName = 'test';
const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true } );

// Connect to MongoDB server, run the findDocuments function and close the connection.
client.connect(function(err) {

    assert.equal(null, err);
    console.log('Connected successfully to MongoDB server on port 27017');
    const db = client.db(dbName);

    findDocuments(db, function() {
        client.close();
    });
});

const findDocuments = function(db, callback) {

  const collection = db.collection('test');

  collection.find({}).toArray(function(err, docs) {
    assert.equal(err, null);
    console.log('Found the following documents:');
    console.log(docs)
	mongoDocsToDisplay = docs;
    callback(docs);
  });
}