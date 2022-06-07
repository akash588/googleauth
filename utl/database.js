const _connectToDb = function (callback) {
  const MongoClient = require('mongodb').MongoClient;
  const prodPublicDbUrl = `mongodb+srv://doadmin:J7Nm648AK3y29bc1@kelecctronic-mongdb-blr1-65258-cc1192bb.mongo.ondigitalocean.com/admin?authSource=admin&replicaSet=kelecctronic-mongdb-blr1-65258&tls=true&tlsCAFile=${__dirname+'/ca-certificate.crt'}`;
  //const dbUrl = 'mongodb://127.0.0.1:27017';
  MongoClient.connect(
    prodPublicDbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
    function (err, db) {

      if (err) {
        callback({
          isSuccess: false,
          error: err
        })
      };
      const dbo = db.db('promoMachine-1024');


      callback({
        isSuccess: true,
        db: dbo,
      });
    });
}
module.exports = _connectToDb;