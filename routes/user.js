const express = require('express');
var { registerFormValidation,ensureAuthenticated,cartItems,upload,addToCart,renewBookFunction,returnBookFunc,borrowBookFunc,calculateFine,CartRemoveItem } = require('./utils');
const multer = require('multer');
const user = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user');
var Book = require('../models/book');
var BorrowBook = require('../models/borrowBook');
var Cart = require('../models/cart');
//var BorrowBook = require('../models/borrowBook');

user.all('/*', function (req, res, next) {
    req.app.locals.layout = 'layout(user)materialize'; // set User layout here
    next(); // pass control to the next handler
});



user.get(['/','/home','/home/:_id'],(req,res) => {
    /*if(req.user){
        //console.log('user',req.user.accountType)
        if(req.user.accountType == 'librarian'){
            res.redirect('/librarian/home')
        } else {
            res.render('userhome',{title:'User Home'});        
        }
    }*/
    res.render('userhome',{title:'User Home'});
});

user.get('/:role/account',(req,res) => {
    if(req.params.role == 'role=>librarian'){
        var role = true;
    } else{
        var role = null;
    }
    res.render('account',{title:'User Login',role:role})
});

user.get(['/showBooks/:_id','/showBooks/'],ensureAuthenticated,(req,res) => {//

    Book.find({},(err,data) => {
        if(err) throw err;
        else{
            ////console.log(data[0].imageToHBS[0]);
            
            res.render('showBooks',{books:data,user:req.user});
        }
    })
    //res.render('showBooks',{title:'User Login',layout:'layout(user)materialize'})
});

user.get(['/cart/:_id','/cart/'],ensureAuthenticated,(req,res) => {
    cartItems(req.user,req,res);
   
    
});

user.get(['/viewPosts/:_id','/viewPosts/'],ensureAuthenticated,(req,res) => res.render('viewPosts',{title:'User Login',
layout:'layout(user)materialize'}));

user.get('/login',(req,res) => res.render('login'));

user.get('/logout',(req,res) => {
    req.logout();
    req.flash('success_msg','Successfully Logged out!');
    res.redirect('/users/home');
});

user.get('/updateInfo/edit/:id',ensureAuthenticated,(req,res) => {
    //console.log(req.params.id)
    User.findById(req.params.id,(err,user) => {
        if(err) throw err;
        res.render('updateInfo',{user:user})
    });
});

// Route to Change the Profile Picture
user.get('/profile/:id',ensureAuthenticated,(req,res) => {
    //console.log(req.params.id);
    User.findById(req.params.id, (err,user) => {
        if (err) throw err;
        ////console.log(user.firstName,user.lastName);
        var query = {userName:req.user.userName}
        BorrowBook.find(query,(err,bookData)=> {
            if(err) throw err;
            //console.log(bookData)
            calculateFine(bookData,req.user,req,res);
            
        });
        
    });
});
// Test Route
user.get('/profileInfo/edit/:id',(req,res) => {
    //console.log(req.params.id,'in get')
    User.findById(req.params.id, (err,user) => {
        if (err) throw err;
        //console.log(user)
        res.render('profileInfo')
    })
    
});
//  Pagination Test Route
//user.get('/paginate')


passport.use(new LocalStrategy(
    function(username, password, done) {
        User.getUserByUsername(username,function(err,user){
            if(err) throw err;
            if(!user){
                return done(null,false,{message:'Unknown User'});
            }
            User.comparePassword(password,user.password,function(err,isMatch){
                if(err) throw err;
                if(isMatch){
                    return done(null,user);
                }
                else{
                    return done(null,false,{message:'Invalid Password'});
                }
            })
        })
      
}));
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.getUserById(id, function(err, user) {
      done(err, user);
    });
});


user.post('/:role/login',
  passport.authenticate('local',{successRedirect:"/users/home",failureRedirect:"account",failureFlash:true}),
  function(req, res) {
    req.flash('success_msg','Logged in Successfully');
    res.redirect('/users/home')
});


user.post('/:role/account',(req,res,next) => {
    ////console.log('Posted',req.body.email,req.body.password,req.body.dateOfBirth,req.body.doorNo,req.body.streetName);
    if (req.body.formType == 'Register'){      
       
        var errors = (registerFormValidation(req,req.body));
        if(errors){
            res.render('account',{
                errors:errors
            });
        }
        else{
            ////console.log('No');
            //res.redirect('home')
            var newUser = new User({
                firstName:req.body.firstName,
                lastName:req.body.lastName,
                dateOfBirth:req.body.dateOfBirth,
                doorNo:req.body.doorNo,
                streetName:req.body.streetName,
                areaName:req.body.areaName,
                zipCode:req.body.zipCode,
                stateName:req.body.stateName,
                countryName:req.body.countryName,
                mobileNumber:req.body.mobileNumber,
                membershipName:req.body.membershipName,
                userName:req.body.userName,
                email:req.body.email,
                password:req.body.passName,
                accountType:'users'
            });
            User.createUser(newUser,(err,user) =>{
                if(err) throw err;
                //console.log(user,req.body.file);
            });
            req.flash('success_msg','You are Registered and can now Login');
            //console.log(newUser);
            res.redirect('/users/home');
            //next()
            
        }
    }
});


// Route to update Profile Pic
user.post('/updateProfilePic/:id',(req,res) => {
    upload(req, res, (err) => {
        if(err){
          res.render('profileInfo', {
            msg: err
          });
      } 
      else {
            if(req.file == 'undefined'){
                res.render('profileInfo',{ msg:'Error No File Selected!'});
            }
            else{
                req.flash('success_msg','Image Uploaded Successfully');
                //console.log(req.file)
                User.update({_id:req.params.id},
                    {
                        imageFile:req.file
                    },(err) => {
                        if(err) //console.log(err);
                        res.redirect('/users/profile/'+req.params.id);
                    });
            }
      }
    });
});
//  Route To Update Personal Info
user.post('/updateInfo/edit/:id',(req,res) => {
    //console.log(req.params.id)
    User.findByIdAndUpdate({_id:req.params.id},
        {
            doorNo:req.body.doorNo,
            streetName:req.body.streetName,
            areaName:req.body.areaName,
            zipCode:req.body.zipCode,
            email:req.body.email,
            mobileNumber:req.body.mobileNumber,
            userDescription:req.body.userDescription  
        },(err,user) => {
            if(err) throw err;
            else {

                res.redirect('/users/profile/'+req.params.id);
        }
        });
});
user.post('/showBooks/:bookId',ensureAuthenticated,(req,res) => {
    if(req.body.submit == 'Borrow'){
        borrowBookFunc(req.user,req.params.bookId,req,res);
        //console.log('Borrowed the Book ',req.user.userName,req.params.bookId,req.user.membershipName)
        
    }else if(req.body.submit == 'Cart'){
        //addToCart(req.user,req.params.bookId);
        //console.log(req.params.bookId,'is in ',req.user.userName+"'s Cart")
        addToCart(req.user,req.params.bookId);
        req.flash('success_msg','Added to Cart Successfully!')
        res.redirect('/users/showBooks/'+req.user._id)
    }else if(req.body.submit == 'RemoveFromCart'){
        CartRemoveItem(req.params.bookId,req.user,res,req);
        //console.log(req.params.bookId)
    }
})

user.post('/returnRenew/:bookIsbn',ensureAuthenticated,(req,res) => {
    if(req.body.submit == 'Return'){
        //console.log('Return')
        returnBookFunc(req.user,req.params.bookIsbn,req,res);
    }else if(req.body.submit == 'Renew'){
        //console.log('Renew')
        renewBookFunction(req.user,req.params.bookIsbn);
    }
    req.flash('success_msg','Book Renewed Successfully!')
    res.redirect('/users/profile/'+req.user._id)
});

user.post('/cart/:_id',ensureAuthenticated,(req,res) => {
    if(req.body.submit == 'Remove All'){
        Cart.find({userName:req.user.userName},(err,array) => {
            for (let i = 0; i < array.length; i++) {
                array[i].remove();
            }
        });
        req.flash('success_msg','Removed All Books From Cart!')
        res.redirect('/users/home')
    }else if(req.body.submit == 'Borrow All'){
        //console.log(req.body.submit,'in elseif')
        cartItems(req.user,req,res,req.body.submit);
    }else if(req.body.submit == 'Return All'){
        BorrowBook.find({userName:req.user.userName},(err,data) => {
            ////console.log(data[0].isbnNumber)
            for (let i = 0; i < data.length; i++) {
                returnBookFunc(req.user,data[i].isbnNumber,req,res)
            }
        });
        req.flash('success_msg','Returned All Books SuccessFully!');
        res.redirect('/users/home');
    }else if(req.body.submit == 'Renew All'){
        BorrowBook.find({userName:req.user.userName},(err,data) => {
            //console.log(data[0].isbnNumber)
            for (let i = 0; i < data.length; i++) {
                renewBookFunction(req.user,data[i].isbnNumber)
            }
            req.flash('success_msg','Renewed All Books SuccessFully!');
            res.redirect('/users/profile/'+req.user._id);
        });
        
    }
    
});
user.post('/optionals/:userId',(req,res) => {
    //console.log(req.body.occupation,req.body.functionality,req.body.genre)
    
    User.findByIdAndUpdate(req.params.userId,
        {
            occupation:req.body.occupation,
            functionality:req.body.functionality,
            genre:req.body.genre
        },
        (err,data) => {
            if(err) throw err;
            //console.log(data,'data');
            res.redirect('/users/home');
        });
});
module.exports = user;