const multer = require('multer');
const path = require('path');
var BorrowBook = require('../models/borrowBook');
var Book = require('../models/book');
var Cart = require('../models/cart');

var registerFormValidation = (req,form,libAcc) => {
    req.checkBody('firstName','First Name is Required').notEmpty();
    req.checkBody('lastName','Last Name is Required').notEmpty();
    req.checkBody('dateOfBirth','Date of Birth is Required').notEmpty();
    req.checkBody('doorNo','Door Number is Required').notEmpty();
    req.checkBody('streetName','Street Name is Required').notEmpty();
    req.checkBody('areaName','Locality/District Name is Required').notEmpty();
    req.checkBody('zipCode','Zip Code is Required').notEmpty();
    req.checkBody('stateName','State Name is Required').notEmpty();
    req.checkBody('countryName','Country Name is Required').notEmpty();
    req.checkBody('mobileNumber','Mobile Number is Required').notEmpty();
    if(!(libAcc == true)){
    req.checkBody('membershipName','MemberShip is Required').notEmpty();
    }
    req.checkBody('userName','User Name is Required').notEmpty();
    req.checkBody('email','Email is Required').notEmpty();
    req.checkBody('passName','Password is Required').notEmpty();
    req.checkBody('confPassName','Passwords Mismatch').equals(req.body.passName);

    var errors = req.validationErrors();

    return errors
    
};
var ensureAuthenticated = (req,res,next) => {
    if(req.isAuthenticated()){
        return next();
    }
    else{
        req.flash('error_msg','You are not Logged In');
        res.redirect('/users/role=>user/account');
    }
}
var ensureAuthenticatedLibrarian = (req,res,next) => {
    if(req.isAuthenticated()){
        return next();
    }
    else{
        req.flash('error_msg','You are not Logged In');
        res.redirect('/librarian/role=>librarian/account');
    }
}


const profPicStorage = multer.diskStorage({
    destination: 'client/images/profile-pics/',
    filename: function(req, file, cb){
      cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
// BookPic Storage
const bookImageStorage = multer.diskStorage({
    destination: 'client/images/book-images/',
    filename: function(req, file, cb){
      cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

var bookUpload = multer({
    storage:bookImageStorage
});

// Init Upload
const upload = multer({
    storage: profPicStorage,
    limits:{fileSize:(1024000*10)},
    fileFilter:function(req,file,cb){
        checkFileType(file,cb);
    }
}).single('profilePic');

//Check File Type
function checkFileType(file,cb){
    //  Allowed Extensions
    const fileTypes =/jpeg|jpg|png|gif/;
    //  Check ext
    const extname = fileTypes.test(path.extname
        (file.originalname).toLowerCase());
        // Check Mime
    const mimetype = fileTypes.test(file.mimetype);

    if(mimetype && extname){
        return cb(null,true);
    }
    else{
        cb('Error: Upload Images Only!')
    }
}


var borrowBookFunc = (user,bookId,req,res,func='Single') => {
    //console.log(bookId)
    var borrowTime = new Date();
    var renewTime = new Date();
    var offsetTime = new Date().getTimezoneOffset();
    borrowTime.setMinutes(borrowTime.getMinutes() - offsetTime);
    renewTime.setMinutes(renewTime.getMinutes() - offsetTime);
    if(user.membershipName == 'g-Prime'){
        renewTime.setMinutes(borrowTime.getMinutes() + 10)
    }else if(user.membershipName == 'g-Standard'){
        renewTime.setMinutes(borrowTime.getMinutes() + 5)
    }else if(user.membershipName == 'g-Classic'){
        renewTime.setMinutes(borrowTime.getMinutes() + 3)
    }
    ////console.log(user.firstName,'are a Prime User',renewTime ,'is the Renewal Time for ',bookId)
    query = {_id:bookId}
    Book.findOne(query,(err,book) => {
            if(err) throw err;
            else{
                var checkquery = {userName:user.userName,isbnNumber:book.isbnNumber}
                BorrowBook.findOne(checkquery,(err,data)=> {
                    if(err) throw err;
                    if(!data){
                        var newBorrowBook = new BorrowBook({
                            userName:user.userName,
                            bookName:book.bookName,
                            authorName:book.authorName,
                            bookDept:book.bookDept,
                            isbnNumber:book.isbnNumber,
                            borrowTime:borrowTime,
                            renewTime:renewTime,
                            imageFile:book.imageToHBS[0]
                        });
                        newBorrowBook.save((err) => {
                            if(err) throw err;
                            ////console.log(newBorrowBook,book.availableCopies);
                        });
                        
                        Book.findOneAndUpdate({_id:bookId},
                            {availableCopies:book.availableCopies-1},
                            (err,data) => {
                                if(err) throw err;
                                //console.log(data ,'Book Update');
                                
                        })
        
                        
                        //console.log(user.userName,book._id)
                        Cart.findOneAndRemove({userName:user.userName,bookId:book._id},
                            (err,data) => {
                                if(err) throw err;
                                //console.log(data,'Cart Update');
                                req.flash('success_msg','Book Removed From Cart Successfully!')

                            });
                        if(func == 'Single'){
                            req.flash('success_msg','Book Borrowed Successfully!')
                            res.redirect('/users/showBooks/'+req.params.bookId)
                        }
                    }
                    else{
                        //console.log(data,'The User has the Same book he borrows now')
                        req.flash('error_msg','You Have The Same Book Already!')
                        res.redirect('/users/showBooks/'+req.params.bookId)
                    }
                })
                
                    
        }
    });
    
    
    
}
var addToCart = (user,bookId) => {
    Book.findById(bookId,(err,book) => {
        if(err) throw err;
        else{
            //console.log(book._id)
            var newItems = new Cart({
                bookName:book.bookName,
                authorName:book.authorName,
                bookDept:book.bookDept,
                isbnNumber:book.isbnNumber,
                imageToHBS:book.imageToHBS,
                userName:user.userName,
                bookId:book._id,
                membershipName:user.membershipName,
                bookDes:book.bookDes
            });
            newItems.save((err) => {
                if(err) throw err;
            })
        }
    });
}
var cartItems = (user,req,res,type='show') => {
    //console.log(type)
    let query = {userName:user.userName}
    Cart.find(query,(err,items) => {
        if(err) throw err;
        else{
            if(type == 'show'){
                //console.log(items.length)
                res.render('cart',{cart:items,title:'User Login',user:user});
            }else if(type == 'Borrow All'){
                var func = 'fromCart'
                for (let i = 0; i < items.length; i++) {
                    //console.log(items[i].bookId)
                    borrowBookFunc(user,items[i].bookId,req,res,func);    
                }
            req.flash('success_msg','Borrowed All Books From Cart!')
            res.redirect('/users/home')   
            }
        }
    });
}
var CartRemoveItem = (bookId,user,res,req) => {
    Cart.findOneAndRemove({userName:user.userName,bookId:bookId},
        (err,data) => {
            if(err) throw err;
            //console.log(data);
            req.flash('success_msg','Book Removed From Cart Successfully!')
            res.redirect('/users/cart/'+user._id)
    });
}
var calculateFine = (book,user,req,res) => {
    var now = new Date();
    const offset = new Date().getTimezoneOffset();
    now.setMinutes(now.getMinutes() - offset);
    let query = {userName:user.userName}
    BorrowBook.find(query,(err,data) => {
        for (let i = 0; i < data.length; i++) {
            
            
            if(user.membershipName == 'g-Prime'){
                if(!(now - data[i].renewTime)<0)
                var fineAmount = (Math.ceil((now - data[i].renewTime)/(1000*60)))* 0.5
            }else if(user.membershipName == 'g-Standard'){
                if(!(now - data[i].renewTime)<0)
                var fineAmount = (Math.ceil((now - data[i].renewTime)/(1000*60)))* 0.75
            }else if(user.membershipName == 'g-Classic'){
                if(!(now - data[i].renewTime)<0)
                var fineAmount = (Math.ceil((now - data[i].renewTime)/(1000*60)))* 1
            }
            
            let book = data[i];
            ////console.log(now,data[i].renewTime,data[i].renewTime - now,fineAmount);
            //if(book.renewTime)]
            if(!(now - data[i].renewTime)<0){
                BorrowBook.findOneAndUpdate({_id:book._id},
                {fine:fineAmount},(err,data) => {
                    if(err) throw err;
                    //console.log(data)
                });
            }
        }
    });
    BorrowBook.find(query,(err,data) => {
        res.render('profile',{borrowBooks:data,userId:user._id,mobileNumber:user.mobileNumber,email:user.email,user:user,imageFile:user.imageFile.path.substring(6)});
    });
}
var returnBookFunc = (user,bookIsbn,req,res) => {
    ////console.log(bookIsbn,'utiosls')
    Book.findOne({isbnNumber:bookIsbn},(err,book) => {
        if(err) throw err;
        //console.log(book)
        Book.findByIdAndUpdate(book._id,
            {availableCopies:book.availableCopies+1},
            (err,data) => {
                //console.log(data);
            });
        BorrowBook.findOneAndRemove({userName:user.userName,isbnNumber:book.isbnNumber},
            (err,data) => {
                if(err) throw err;
                //console.log(data);
            });
    });
    
}

var renewBookFunction = (user,bookIsbn) => {
    var now = new Date();
    const offset = new Date().getTimezoneOffset();
    now.setMinutes(now.getMinutes() - offset);
    //console.log(now,'reneew',user.membershipName)
    if(user.membershipName == 'g-Prime'){
        now.setMinutes(now.getMinutes() + 100)
    }else if(user.membershipName == 'g-Standard'){
        now.setMinutes(now.getMinutes() + 50)
    }else if(user.membershipName == 'g-Classic'){
        now.setMinutes(now.getMinutes() + 40)
    }
    //console.log(now)
    BorrowBook.findOneAndUpdate({userName:user.userName,isbnNumber:bookIsbn},
        {renewTime:now},(err,data) => {
            if(err) throw err;
            //console.log(data);
        });
    
}

//var borrowFunc = function

module.exports = { 
    registerFormValidation,
    ensureAuthenticated,
    profPicStorage,
    upload,
    ensureAuthenticatedLibrarian,
    checkFileType,
    bookUpload,
    calculateFine,
    borrowBookFunc,
    renewBookFunction,
    cartItems,
    addToCart,
    returnBookFunc,
    CartRemoveItem
    }

/*

        
            */