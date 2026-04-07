const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator')
const User = require('../models/user');
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    }
});

exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    message = message.length > 0 ? message[0] : null;
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: message
    });
};

exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    message = message.length > 0 ? message[0] : null;
    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Sign Up',
        errorMessage: message,
        oldInput:{
            email:'',
            password:'',
            confirmPassword:''
        }
    });
};

exports.postLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(422).render('auth/login',{
            path:'/login',
            pageTitle:'Login',
            errorMessage:errors.array()[0].msg
        })
    }
    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                req.flash('error', 'Invalid email or password');
                return res.redirect('/login');
            }
            return bcrypt.compare(password, user.password).then(doMatch => {
                if (doMatch) {
                    req.session.isLoggedIn = true;
                    req.session.user = { _id: user._id.toString() };
                    return req.session.save(err => {
                        if (err) console.log(err);
                        res.redirect('/');
                    });
                }
                req.flash('error', 'Invalid email or password');
                res.redirect('/login');
            });
        })
        .catch(err => console.log(err));
};

exports.postSignup = (req, res, next) => {
    const { email, password, confirmPassword } = req.body;
    const errors = validationResult(req);

    // 1. Check for validation errors
    if (!errors.isEmpty()) {
        console.log(errors.array());
        // Use 'return' to stop execution so it doesn't move to bcrypt.hash
        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'Sign Up',
            errorMessage: errors.array()[0].msg,
            oldInput:{email:email,password:password,confirmPassword:confirmPassword}
        });
    }

    // 2. Hash password and save user
    bcrypt.hash(password, 12)
        .then(hashedPassword => {
            const user = new User({
                email: email,
                password: hashedPassword,
                cart: { items: [] }
            });
            return user.save();
        })
        .then(result => {
            // 3. Success: Redirect and send email
            res.redirect('/login');
            return transporter.sendMail({
                to: email,
                from: process.env.EMAIL_FROM,
                subject: 'Signup succeeded!',
                html: '<h1>Welcome! You successfully signed up.</h1>'
            });
        })
        .catch(err => {
            // This catch is now correctly attached to the chain
            console.log("SIGNUP ERROR:", err);
        });
};

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({ email: req.body.email })
            .then(user => {
                if (!user) {
                    req.flash('error', 'No account with that email found.');
                    return res.redirect('/reset');
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save();
            })
            .then(result => {
                res.redirect('/');
                const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
                transporter.sendMail({
                    to: req.body.email,
                    from: process.env.EMAIL_USER,
                    subject: 'Password Reset',
                    html: `
                        <p>You requested a password reset</p>
                        <p>Click this <a href="${baseUrl}/reset/${token}">link</a> to set a new password</p>
                    `
                });
            })
            .catch(err => console.log(err));
    });
};

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
        .then(user => {
            if (!user) {
                return res.redirect('/');
            }
            let message = req.flash('error');
            message = message.length > 0 ? message[0] : null;
            res.render('auth/new-password', {
                path: '/new-password',
                pageTitle: 'New password',
                errorMessage: message,
                userId: user._id.toString(),
                passwordToken: token
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

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;

    User.findOne({
        resetToken: passwordToken,
        resetTokenExpiration: { $gt: Date.now() },
        _id: userId
    })
        .then(user => {
            resetUser = user;
            return bcrypt.hash(newPassword, 12);
        })
        .then(hashedPassword => {
            resetUser.password = hashedPassword;
            resetUser.resetToken = undefined;
            resetUser.resetTokenExpiration = undefined;
            return resetUser.save();
        })
        .then(result => {
            res.redirect('/login');
        })
        .catch(err => {
            console.log(err);
        });
};

exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'Reset Password',
        errorMessage: message
    });
};
