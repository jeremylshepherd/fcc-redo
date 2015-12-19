var mongoose = require('mongoose');

var PollSchema = new mongoose.Schema({
  title: String,
  link: String,
  upvotes: {type: Number, default: 0},
  _creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  choices: [{
    choiceText: String,
    votes: {
      type: Number,
      required: true,
      default: 0
    },
    author: String
  }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment'}]
});

PollSchema.methods.upvote = function(cb) {
  this.upvotes += 1;
  this.save(cb);
};


mongoose.model('Poll', PollSchema);
