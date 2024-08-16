const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

module.exports = {
    dbconnect: () => {
        mongoose.connect(process.env.Mongo_url, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }).then(() => {
            console.log("MongoDB is connected");
        }).catch((error) => {
            console.log("MongoDB connection error:", error);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected, attempting to reconnect...');
            mongoose.connect(process.env.Mongo_url, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            }).catch((error) => {
                console.log("MongoDB reconnection error:", error);
            });
        });
    },

    dbdisconnect: () => {
        console.log('dbdisconnect called'); 
        mongoose.connection.close((err) => {
            if (err) {
                console.log('Error closing MongoDB connection:', err);
            } else {
                console.log('MongoDB connection closed');
            }
        });
    }
};

