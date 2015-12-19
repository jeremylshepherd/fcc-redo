var mongoose = require('mongoose');

var CommentSchema = new mongoose.Schema({
  body: String,
  author: String,
  upvotes: {type: Number, default: 0},
  poll: { type: mongoose.Schema.Types.ObjectId, ref: 'Poll'}
});

mongoose.model('Comment', CommentSchema);
