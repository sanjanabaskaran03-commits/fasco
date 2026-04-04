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
            // Store a lean user reference in the session to avoid serialization issues
            req.session.user = { _id: user._id.toString() };
            
            return req.session.save(err => {
                if(err) console.log(err)
                res.redirect('/');
            });
        })
        .catch(err => console.log(err));
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    if (err) {
        console.log(err);
    }
    res.redirect('/login');
  });
};
