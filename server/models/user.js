const mongoose = require('mongoose');
const validator = require('validator');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

var UserSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        minlength: 3,
        trim: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        minlength: 1,
        trim: true,
        unique: true,
        validate: {
            validator: (value) => {
                return validator.isEmail(value);
            }, 
            message: `VALUE is not a valid email.`
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 8
    },
    tokens: [{
        access : {
            type: String,
            required: true
        },
        token: {
            type: String,
            required: true
        }
    }]
});

UserSchema.methods.toJSON = function() {
    var user = this;
    var userObject = user.toObject();

    return _.pick(userObject, ['_id', 'email, username']);
}

UserSchema.methods.generateAuthToken = function() {
    var user = this;

    var access = "auth";
    var token = jwt.sign({_id: user._id.toHexString(), access}, process.env.JWT_SECRET).toString();

    user.tokens.push({
        access,
        token
    });

    return new Promise(async function(resolve, reject) {
        try {
            await user.save();
            resolve(token);
        } catch(e) {
            reject();
        }
    });
}

UserSchema.methods.removeToken = function(token) {
    var user = this;

    return new Promise(async function(resolve, reject) {
        var updatedUser = await user.updateOne({$pull: {tokens: {token}}});
        if(!updatedUser) reject();
        resolve();
    });
}

UserSchema.statics.findByToken = function(token) {
    User = this;

    return new Promise(async function(resolve, reject) {
        try {
            var decoded = jwt.verify(token, process.env.JWT_SECRET);
    
            var user = await User.findOne({
                _id: decoded._id,
                "tokens.token": token,
                "tokens.access": "auth"
            });
            if(!user) reject();
            resolve(user);
        } catch(e) {
            return reject();
        }
    });
}

UserSchema.statics.findByCredentials = function(emailOrUsername, password) {
    User = this;

    return new Promise(async function(resolve, reject) {
        try {
            var user = await User.findOne({$or: [{email: emailOrUsername}, {username: emailOrUsername}]});
            if(!user) {
                reject();
            }
            var matches = await bcrypt.compare(password, user.password);
            if(!matches) reject();
            resolve(user);
        } catch(e) {
            reject();
        }
    });
}

UserSchema.pre('save', function(next) {
    var user = this;

    if(user.isModified('password')) {
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(user.password, salt, (err, hash) => {
                user.password = hash;
                next();
            });
        });
    } else {
        next();
    }
});

var User = mongoose.model('User', UserSchema);

module.exports = {
    User
}