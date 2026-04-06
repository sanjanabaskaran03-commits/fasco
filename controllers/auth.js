const crypto=require('crypto')
const bcrypt = require('bcryptjs');
const user = require('../models/user');
const User = require('../models/user');
const nodemailer=require('nodemailer')
const sendgridTransport=require('nodemailer-sendgrid-transport')

const transporter=nodemailer.createTransport(sendgridTransport({
    auth:{
        api_key:process.env.SENDGRID_API_KEY
    }
}))
exports.getLogin = (req, res, next) => {
    let message=req.flash('error')
    if(message.length>0){
        message=message[0]
    }
    else{
        message=null
    }
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage:message
    });
};
exports.getSignup = (req, res, next) => {
    let message=req.flash('error')
    if(message.length>0){
        message=message[0]
    }
    else{
        message=null
    }
    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Sign Up',
        errorMessage:message
    });
};

exports.postLogin = (req, res, next) => {
    const { email, password } = req.body;
    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                req.flash('error','Invalid email or password')
                return res.redirect('/login');
            }
            return bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if (doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = { _id: user._id.toString() };
                        return req.session.save(err => {
                            if (err) console.log(err);
                            res.redirect('/');
                        });
                    }
                    req.flash('error','Invalid email or password')
                    res.redirect('/login');
                });
        })
        .catch(err => console.log(err));
};
exports.postSignup = (req, res, next) => {
    const { email, password, confirmPassword } = req.body;
    user.findOne({email:email})
        .then(userDoc=>{
            if(userDoc){
                req.flash('error','Email already exists, please pick a different one')
                return res.redirect('/signup');
            }
            return bcrypt
            .hash(password,12)
            .then(hashedPassword=>{
            const user = new User({
                email:email,
                password:hashedPassword,
                cart:{items:[]}
            });
            return user.save();
        })
        .then(result => {
            res.redirect('/login'); 
            return transporter.sendMail({
                to: email,
                from: 'your-verified-email@domain.com', 
                subject: 'Signup succeeded!',
                html: '<h1>Success!</h1>'
            });
        })
        .catch(err => {
            console.log("MAIL ERROR:", err); 
        });
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

exports.getReset = (req, res, next) => {
    let message=req.flash('error')
    if(message.length>0){
        message=message[0]
    }
    else{
        message=null
    }
    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'Reset Password',
        errorMessage:message
    });
};

exports.postReset=(req,res,next)=>{
    crypto.randomBytes(32,(err,buffer)=>{
        if(err){
            console.log(err)
            return res.redirect('/reset')
        }
        const token=buffer.toString('hex')
        user.findOne({email:req.body.email})
        .then(user =>{
            if(!user){
                req.flash('error','No account with that email found.')
                return res.redirect('/reset')
            }
            user.reset=token
            user.resetTokenExpiration=Date.now()+3600000
            return user.save()
        })
        .then(result=>{
            res.redirect('/')
            transporter.sendMail({
            to: req.body.email,
            from: 'mailid', 
            subject: 'Password Reset',
            html: `
                <p>You requested a password reset</p>
                <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password</p>
            `
        });
        })
        .catch(err =>{
            console.log(err)
        })
    })
}

exports.getNewPassword=(req,res,next)=>{
    const token=req.params.token
    user.findOne({reset:token,resetTokenExpiration:{$gt:Date.now()}})
    .then(user=>{
        let message=req.flash('error')
        if(message.length>0){
            message=message[0]
        }
        else{
            message=null
        }
        res.render('auth/new-password', {
            path: '/new-password',
            pageTitle: 'New password',
            errorMessage:message,
            userId:user._id.toString()
        });
    })
}
