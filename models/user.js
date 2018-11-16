const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost/diGiLib',{ useNewUrlParser: true });


var UserSchema = mongoose.Schema({
    firstName:{
        type:String,
        required:true,
    },
    lastName:{
        type:String,
        required:true,
    },
    dateOfBirth:{
        type:String,
        required:true,
    },
    doorNo:{
        type:Number,
        required:true
    },
    streetName:{
        type:String,
        required:true
    },
    areaName:{
        type:String,
        required:true
    },
    zipCode:{
        type:Number,
        required:true
    },
    stateName:{
        type:String,
        required:true
    },
    countryName:{
        type:String,
        required:true
    },
    mobileNumber:{
        type:Number,
        required:true,
        unique:true
    },
    membershipName:{
        type:String,
        required:true,
        default:'LibrarianAccount'
    },
    userName:{
        type:String,
        required:true,
        unique:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    accountType:{
        type:String,
        required:true
    },
    userDescription:{
        type:String,
        default:''
    },
    occupation:{
        type:String
    },
    functionality:{
        type:String
    },
    genre:{
        type:String
    },
    imageFile:{
            fieldname: {
                type:String,
                default:'profilePic'
            },
            originalname: {
                type:String,
                default:'default.jpg'
            },
            encoding: {
                type:String,
                default:'7bit'
            },
            mimetype: {
                type:String,
                default:'image/jpeg'
            },
            destination: {
                type:String,
                default:'client/images/profile-pics/'
            },
            filename: {
                type:String,
                default:'profilePic-default.jpg'
            },
            path: {
                type:String,
                default:'client\\images\\profile-pics\\profilePic-default.jpg'
            },
            size: {
                type:Number,
                default:16579
            }
    }
    
});
var User = module.exports = mongoose.model('User',UserSchema);

module.exports.createUser = (newUser,callback) => {
    var bcrypt = require('bcryptjs');
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(newUser.password, salt, function(err, hash) {
        // Store hash in your password DB.
        newUser.password = hash;
        newUser.save(callback);
    });
});
}
module.exports.getUserByUsername = function(username,callback){
    var query = {userName:username};
    console.log(query)
    User.findOne(query,callback);
}
module.exports.getUserById = function(id,callback){
    User.findById(id,callback);
}
module.exports.comparePassword = function(candidatePassword,hash,callback){
    bcrypt.compare(candidatePassword,hash,function(err, isMatch){
        if(err) throw err;
        callback(null,isMatch);
    });
}