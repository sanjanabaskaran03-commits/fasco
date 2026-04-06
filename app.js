require('dotenv').config({ path: '.env.local' });
const dns = require('dns');
const path = require('path');
const express = require('express');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const User = require('./models/user');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

const app = express();

if (process.env.DNS_SERVERS) {
    const servers = process.env.DNS_SERVERS.split(',').map(s => s.trim()).filter(Boolean);
    if (servers.length) {
        dns.setServers(servers);
    }
}

const store = new MongoDBStore({
    uri: process.env.MONGODB_URI,
    collection: 'sessions'
});

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
    session({
        secret: 'my secret signature', 
        resave: false,                
        saveUninitialized: false,    
        store: store,
        cookie: { 
            maxAge: 60000, 
            httpOnly: true,     
            secure: false        
        }                  
    })
);

app.use((req, res, next) => {
    if (!req.session || !req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
        .then(user => {
            if (!user) {
                return next();
            }
            req.user = user;
            next();
        })
        .catch(err => {
            console.log('Session Middleware Error:', err);
            next();
        });
});

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    next();
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

mongoose.connect(process.env.MONGODB_URI)
    .then(result => {
        console.log("✅ Connected to MongoDB via Mongoose");

        
    })
    .then(() => {
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.log('❌ Connection Error:', err);
    });