const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/diGiLib',{ useNewUrlParser: true });

var BookSchema = mongoose.Schema({
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
    bookCost:{
        type:String,
        required:true
    },
    bookDes:{
        type:String,
        required:true
    },
    yearPublished:{
        type:String,
        required:true
    },
    bookPublisher:{
        type:String,
        required:true
    },
    isbnNumber:{
        type:String,
        required:true,
        unique:true
    },
    bookImage:{
        fieldname: {
            type:String,
            default:'bookImage'
        },
        originalname: {
            type:String,
            default:'images.png'
        },
        encoding: {
            type:String,
            default:'7bit'
        },
        mimetype: {
            type:String,
            default:'image/png'
        },
        destination: {
            type:String,
            default:'client/images/book-images/'
        },
        filename: {
            type:String,
            default:'bookImage-default.png'
        },
        path: {
            type:String,
            default:'client\\images\\book-images\\bookImage-default.png',
        },
        size: {
            type:Number,
            default:1653
        }
    },
    imageToHBS:{
        type:Array,
    },
    availableCopies:{
        type:Number,
        required:true
    },
    bookDetail:{
        pages:{
            type:String,
            required:true
        },
        totalCopies:{
            type:Number,
            required:true
        },
        dateAdded:{
            type:Date,
            default:Date.now
        },
        location:{
            floorNo:{
                type:String,
                required:true
            },
            shelfNo:{
                type:String,
                required:true
            },
            rackNo:{
                type:String,
                required:true
            }
        }
    }
    
});
BookSchema.methods.imagePath = function(){
    var bookImagePath =  (this.bookImage.path)
    for(let i=0;i<((this.bookImage.path).length);i++){
        bookImagePath[i] =  bookImagePath[i].substring(6);
    }
    console.log(bookImagePath);
    return bookImagePath;
}

var Book = module.exports = mongoose.model('Book',BookSchema);

module.exports.updatePath = function(path,callback){
    console.log(path.substring(6));
    callback();
}