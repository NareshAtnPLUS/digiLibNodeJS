const express = require('express');
const librarian = express.Router();
var { registerFormValidation,ensureAuthenticatedLibrarian,upload,bookUpload } = require('./utils');
const multer = require('multer');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user');
var Book = require('../models/book');
const exphbs = require('express-handlebars');
var BorrowBook = require('../models/borrowBook');

librarian.all('/*', function (req, res, next) {
    req.app.locals.layout = 'layout(lib)materialize'; // set Librarian layout here
    next(); // pass control to the next handler
});


librarian.get(['/','/home','/home/:lib'],(req,res) => {
    /*/if(req.user){
        //console.log('user',req.user.accountType)
        if(req.user.accountType == 'users'){
            res.redirect('/users/home')
        } else{
            res.render('libhome',{title:'home'});      
        }
    }/*/
    
    //res.redirect('/'+role+'/home')
        res.render('libhome',{title:'home'});
});

librarian.get('/:role/account',(req,res) => {
    ////console.log('Account')
    //console.log(req.params.role)
    if(req.params.role == 'role=>librarian'){
        var role = true;
    } else{
        var role = null;
    }
    res.render('account',{title:'User',role:role})
});
librarian.get('/login',(req,res) => res.render('login'));

librarian.get('/logout',(req,res) => {
    req.logout();
    req.flash('success_msg','Successfully Logged out!');
    res.redirect('/librarian/home');
});

librarian.get('/updateInfo/edit/:id',ensureAuthenticatedLibrarian,(req,res) => {
    //console.log(req.params.id,'in librarian');//need to be erased
    User.findById(req.params.id,(err,user) => {
        if(err) throw err;
        res.render('updateInfoLib',{user:user})
    });
});

// Route to Change the Profile Picture
librarian.get('/profile/:id',ensureAuthenticatedLibrarian,(req,res) => {
    //console.log(req.params.id,'in librarian');//need to be erased
    User.findById(req.params.id, (err,user) => {
        if (err) throw err;
        //console.log(user.firstName,user.lastName);
        res.render('profileLib',{userId:user._id,mobileNumber:user.mobileNumber,email:user.email,imageFile:user.imageFile.path.substring(6),user:user})
    });
});

//  Route to Add New Books
librarian.get('/RegisterBook',ensureAuthenticatedLibrarian,(req,res) => {//
    res.render('addNewBooks');
});
librarian.get('/RegisterBook/UploadImageFor/:bookName',ensureAuthenticatedLibrarian,(req,res) => {//ensureAuthenticatedLibrarian
    res.render('uploadBook');
});



// Test Route
librarian.get('/profileInfo/edit/:id',(req,res) => {
    //console.log(req.params.id,'in get')
    User.findById(req.params.id, (err,user) => {
        if (err) throw err;
        //console.log(user)
        res.render('profileInfo')
    })
    
});

librarian.get(['/monitorBooks/','/monitorBooks/:id'],(req,res) => {
    //BorrowBook.find({bok})
    res.render('monitorBooks')
})

librarian.get('/dartk/:_id',(req,res) => {
    query = {_id:req.params._id}
    Book.findOne(query,
        (err,datam) => {
            if(err) throw err;
            else{
                Book.findOneAndUpdate(query,
                    {imageToHBS:datam.imagePath()},
                    (err,data) => {
                        if(err) throw err;
                        else{
                            //console.log(data,'//console.log(data)')
                        }
                    })
                //console.log(datam,'dataum');
                res.redirect('/librarian/home')
            }
        })
})


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


librarian.post('/:role/login',
  passport.authenticate('local',{successRedirect:"/librarian/home",failureRedirect:"/librarian/role=>librarian/account",failureFlash:true}),
  function(req, res) {
    //console.log(reeq.params.role+' in Login POST Route')
    req.flash('success_msg','Logged in Successfully');
    res.redirect('/librarian/home/librarian')
});


librarian.post('/:role/account',(req,res,next) => {
    ////console.log('Posted',req.body.email,req.body.password,req.body.dateOfBirth,req.body.doorNo,req.body.streetName);
    if (req.body.formType == 'Register'){      
       
        var errors = (registerFormValidation(req,req.body,libAcc=true));
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
                accountType:'librarian'
            });
            User.createUser(newUser,(err,user) =>{
                if(err) throw err;
                //console.log(user,req.body.file);
            });
            req.flash('success_msg','You are Registered and can now Login');
            //console.log(newUser);
            res.redirect('/librarian/home');
            //next()
            
        }
    }
});


// Route to update Profile Pic
librarian.post('/updateProfilePic/:id',ensureAuthenticatedLibrarian,(req,res) => {
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
                        res.redirect('/librarian/profile/'+req.params.id);
                    });
            }
      }
    });
});
//  Route To Update Personal Info
librarian.post('/updateInfo/edit/:id',ensureAuthenticatedLibrarian,(req,res) => {
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

                res.redirect('/librarian/profile/'+req.params.id);
        }
        });

});
//  Route to Add New Book method => POST
librarian.post('/RegisterBook',ensureAuthenticatedLibrarian,(req,res) => {
    
    var newBook = new Book({
        bookName:req.body.bookName,
        authorName:req.body.authorName,
        bookDept:req.body.bookDepartment,
        bookCost:req.body.cost,
        bookDes:req.body.bookDescription,
        yearPublished:req.body.yearPublished,
        bookPublisher:req.body.publication,
        isbnNumber:req.body.isbnNumber,
        availableCopies:req.body.copies,
        bookDetail:{
            pages:req.body.pages,
            totalCopies:req.body.copies,
            location:{
                floorNo:req.body.floorNo,
                shelfNo:req.body.shelfNo,
                rackNo:req.body.rackNo
            }
        }
    });

    newBook.save((err) =>{
        if(err) throw err;
        //console.log(newBook)
        req.flash('success_msg','Book Added to the DataBase Successfully!')
        res.redirect('/librarian/RegisterBook/UploadImageFor/'+req.body.bookName)
    });
});

librarian.post('/RegisterBook/UploadImageFor/:bookName',bookUpload.any(),(req,res,next) => {//,ensureAuthenticatedLibrarian
    //console.log(req.files,req.params.bookName)
    query = {bookName:req.params.bookName}
    Book.findOneAndUpdate(query,
        {bookImage:req.files},
        (err,data) => {
            if(err) throw err;
            else{
                //console.log(data._id)                
                ////console.log((data.bookImage.path).substring(6),'to be madee')
            }
            req.flash('success_msg','Book Images Uploaded Successfully');
            res.redirect('/librarian/dartk/'+data._id)
    });
    
});


module.exports = librarian;