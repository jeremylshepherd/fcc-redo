var mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');

var UserSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  username: {
    type: String,
    lowercase: true,
    unique: true
  },
  polls: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Poll'}],
  hash: String,
  salt: String
});

UserSchema.methods.generateJWT = function() {

  //set expiration to 60 days
  var today = new Date();
  var exp = new Date(today);
  exp.setDate(today.getDate() + 60);
  // var testExp = parseInt(exp.getTime() / 1000);
  return jwt.sign({
    _id: this._id,
    username: this.username,
    expiresIn: '60Days'
  }, 'SECRET');
};

UserSchema.methods.setPassword = function(password) {
  this.salt = crypto.randomBytes(16).toString('hex');

  this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
};

UserSchema.methods.validPassword = function(password) {
  var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');

  return this.hash === hash;
};

mongoose.model('User', UserSchema);
