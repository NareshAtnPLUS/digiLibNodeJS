const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const exphbs = require('express-handlebars');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const passport = require('passport');
const LocalStatergy = require('passport-local').Strategy;
const mongo = require('mongodb');
const mongoose = require('mongoose');
const multer = require('multer');
const expressValidator = require('express-validator');
const methodOverride = require('method-override')

  

// using blueprint like structure
const librarian = require('./routes/librarian');
const users = require('./routes/user');

//  Database Connection
mongoose.connect('mongodb://localhost/diGiLib',{ useNewUrlParser: true });
const db = mongoose.connection;

// Init Webapp
const webapp = express();

// View Engine
webapp.set('views',path.join(__dirname,'views'));
webapp.engine('handlebars',exphbs({defaultLayout:'layout(user)materialize'}));
webapp.set('view engine','handlebars');

//  BodyParser Middleware
webapp.use(bodyParser.json());
webapp.use(bodyParser.urlencoded({extended: false}));
webapp.use(cookieParser());

webapp.use(express.static(path.join(__dirname,'client')));

// Method Override to support put and delete method
webapp.use(methodOverride());


//  Express Session
webapp.use(session({
    secret:'dacad7ad2a6480128619ee5e5c952da0',
    saveUninitialized:true,
    resave:true
}));

//  Passport Initialization
webapp.use(passport.initialize());
webapp.use(passport.session());

webapp.use(expressValidator({
    errorFormatter:function(param,msg,value){
        var namespace = param.split('.'),
        root = namespace.shift(),
        formParm = root;

        while(namespace.length){
            formParm += '[' + namespace.shift() +']';
        }
        return {
            param:formParm,
            msg:msg,
            value:value
        };
    }
}));


//  Using Flash
webapp.use(flash());

webapp.use(function(req,res,next){
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null; 
    res.locals.msg = req.flash('msg');
    next();
});



// Configuring route for routes
webapp.use('/librarian',librarian);
webapp.use('/users',users);

//  Set Port
webapp.set('port', (process.env.PORT || 3000));

webapp.get('/',(req,res)=>{
    res.render("welcome",{title:'Welcome digiLib',layout:'none'})
});

  

module.exports = { webapp };