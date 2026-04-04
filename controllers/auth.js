const User = require('../models/user');

exports.getLogin = (req, res, next) => {
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login'
    });
};

exports.postLogin = (req, res, next) => {
    User.findOne({ email: req.body.email })
        .then(user => {
            if (!user || user.password !== req.body.password) {
                return res.redirect('/login');
            }
            req.session.isLoggedIn = true;
            req.session.user = user;
            
            return req.session.save(err => {
                res.redirect('/');
            });
        })
        .catch(err => console.log(err));
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};