require('dotenv').config({ path: '.env.local' });
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
        store: store                  
    })
);
app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
        .then(user => {
            req.user = user; 
            next();
        })
        .catch(err => console.log('Session Middleware Error:', err));
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

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
    app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    next();
});