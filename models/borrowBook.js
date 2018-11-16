const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/diGiLib',{ useNewUrlParser: true });

var BorrowBookSchema = mongoose.Schema({
    userName:{
        type:String,
        required:true
    },
    bookName:{
        type:String,
        required:true
    },
    authorName:{
        type:String,
        required:true
    },
    bookDept:{
        type:String,
        required:true
    },
    isbnNumber:{
        type:String,
        required:true
    },
    borrowTime:{
        type:Date,
        required:true,
        //default:Date
    },
    renewTime:{
        type:Date,
        required:true,
        default:Date
    },
    imageFile:{
        type:String,
        required:true
    },
    fine:{
        type:Number,
        required:true,
        default:0
    }
});

var BorrowBook = module.exports = mongoose.model('BorrowBook',BorrowBookSchema);