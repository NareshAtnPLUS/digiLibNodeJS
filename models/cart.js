const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/diGiLib',{ useNewUrlParser: true });

var CartSchema = mongoose.Schema({
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
        required:true,
    },
    imageToHBS:{
        type:String,
        required:true
    },
    userName:{
        type:String,
        required:true
    },
    bookId:{
        type:String,
        required:true
    },
    membershipName:{
        type:String,
        required:true
    },
    bookDes:{
        type:String,
        required:true
    }
});

var Cart = module.exports = mongoose.model('Cart',CartSchema);