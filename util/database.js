// const mongodb = require('mongodb');
// const MongoClient = mongodb.MongoClient;

// let _db;

// const mongoConnect = (callback) => {
//     const uri = process.env.MONGODB_URI;

//     if (!uri) {
//         console.error('❌ Error: MONGODB_URI is not defined in your .env file!');
//         process.exit(1); 
//     }

//     MongoClient.connect(uri)
//         .then(client => {
//             console.log("✅ Connected to MongoDB");
//             _db = client.db(); 
//             callback();
//         })
//         .catch(err => {
//             console.error("❌ MongoDB Connection Failed:");
//             console.log(err);
//             throw err;
//         });
// };

// const getDb = () => {
//     if (_db) {
//         return _db;
//     }
//     throw "No database found! Make sure mongoConnect is called first.";
// };

// exports.mongoConnect = mongoConnect;
// exports.getDb = getDb;