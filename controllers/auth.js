const user = require('../models/user');
const User = require('../models/user');

exports.getLogin = (req, res, next) => {
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login'
    });
};
exports.getSignup = (req, res, next) => {
    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Sign Up',
        isAuthenticated: false  
    });
};

exports.postLogin = (req, res, next) => {
    User.findOne({ email: req.body.email })
        .then(user => {
            if (!user || user.password !== req.body.password) {
                return res.redirect('/login');
            }
            req.session.isLoggedIn = true;
            req.session.user = { _id: user._id.toString() };
            
            return req.session.save(err => {
                if(err) console.log(err)
                res.redirect('/');
            });
        })
        .catch(err => console.log(err));
};
exports.postSignup = (req, res, next) => {
    const { email, password, confirmPassword } = req.body;
    user.findOne({email:email})
        .then(userDoc=>{
            if(userDoc){
                return res.redirect('/signup');
            }
            const user = new User({
                email:email,
                password:password,
                cart:{items:[]}
            });
            return user.save();
        })
        .then(result=>{
            res.redirect('/login');
        })
}

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    if (err) {
        console.log(err);
    }
    res.redirect('/login');
  });
};
