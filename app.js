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

// --- DNS Configuration ---
if (process.env.DNS_SERVERS) {
    const servers = process.env.DNS_SERVERS.split(',').map(s => s.trim()).filter(Boolean);
    if (servers.length) {
        dns.setServers(servers);
    }
}

// --- Session Store Setup ---
const store = new MongoDBStore({
    uri: process.env.MONGODB_URI,
    collection: 'sessions'
});

app.set('view engine', 'ejs');
app.set('views', 'views');

// --- Global Middleware ---
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// 1. Session Initialization (MUST be before User middleware and Routes)
app.use(
    session({
        secret: 'my secret signature', 
        resave: false,                
        saveUninitialized: false,    
        store: store                  
    })
);

// 2. User Hydration (This turns session data into a Mongoose User object)
app.use((req, res, next) => {
    if (!req.session || !req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
        .then(user => {
            if (!user) {
                req.session.isLoggedIn = false;
                req.session.user = null;
                return next();
            }
            req.user = user; // Now req.user.addToCart() will work!
            next();
        })
        .catch(err => {
            console.log('Session Middleware Error:', err);
            next();
        });
});

// 3. View Locals (Makes variables available to all EJS templates)
app.use((req, res, next) => {
    res.locals.isAuthenticated = Boolean(req.session && req.session.isLoggedIn);
    // Optional: Add CSRF tokens here later if needed
    next();
});

// --- Routes ---
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

// --- Database Connection & Server Startup ---
mongoose.connect(process.env.MONGODB_URI)
    .then(result => {
        console.log("✅ Connected to MongoDB via Mongoose");

        return User.findOne();
    })
    .then(user => {
        if (!user) {
            const newUser = new User({
                name: 'Admin',
                email: 'admin@test.com',
                password: '123',
                cart: { items: [] }
            });
            return newUser.save();
        }
        return user;
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
