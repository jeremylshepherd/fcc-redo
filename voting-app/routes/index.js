var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();
var passport = require('passport');
var jwt = require('express-jwt');

var Poll = mongoose.model('Poll');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');

var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

router.get('/', function(req, res) {
  res.render('index');
});

router.get('/polls', function(req, res, next) {
  Poll.find(function(err, polls) {
    if(err){ return next(err); }

    res.json(polls);
  });
});

router.post('/polls', auth, function(req, res, next) {
  var poll = new Poll(req.body);
  poll._creator = req.payload.id;

  poll.save(function(err, poll) {
    if(err) { return next(err); }

    res.json(poll);
  });
});

router.param('poll', function(req, res, next, id) {
  var query = Poll.findById(id);

  query.exec(function(err, poll) {
    if(err) { return next(err); }
    if(!poll) { return next(new Error("can't find poll")); }

    req.poll = poll;
    return next();
  });
});

router.param('comment', function(req, res, next, id) {
  var query = Comment.findById(id);

  query.exec(function(err, comment) {
    if(err) { return next(err); }
    if(!comment) { return next(new Error("can't find comment")); }

    req.comment = comment;
    return next();
  });
});

router.param('user', function(req, res, next, id) {
  var query = User.findById(id);

  query.exec(function(err, user) {
    if(err) { return next(err); }
    if(!user) { return next(new Error("can't find poll")); }

    req.user = user;
    return next();
  });
});

router.get('/polls/:poll', function(req, res, next) {
  req.poll.populate('comments', function(err, poll) {
    if(err) { return next(err); }

    res.json(poll);
  });
});

router.get('/polls/:poll', function(req, res, next) {
  req.poll.populate('_creator', function(err, poll) {
    if(err) { return next(err); }

    res.json(poll);
  });
});


router.put('/polls/:poll/upvote', auth, function(req, res, next) {
  req.poll.upvote(function(err, poll) {
    if(err) { return next(err); }

    res.json(poll);
  });
});

router.post('/polls/:poll/comments', auth, function(req, res, next) {
  var comment = new Comment(req.body);
  comment.poll = req.poll;
  comment.author = req.payload.username;

  comment.save(function(err, comment) {
    if(err) { next(err); }

    req.poll.comments.push(comment);
    req.poll.save(function(err, poll) {
      if(err) { return next(err); }

      res.json(comment);
    });
  });
});

router.put('/polls/:poll/comments/:comment/upvote', auth, function(req, res, next) {
  req.comment.upvote(function(err, comment) {
    if(err) { return next(err); }

    res.json(comment);
  });
});

router.post('/register', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  var user = new User();
  
  user.name = req.body.name;
  user.username = req.body.username;

  user.setPassword(req.body.password);

  user.save(function (err){
    if(err){ return next(err); }

    return res.json({token: user.generateJWT()});
  });
});

router.post('/login', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  passport.authenticate('local', function(err, user, info){
    if(err){ return next(err); }

    if(user){
      console.log('success');
      return res.json({token: user.generateJWT()});
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);
});


router.get('/polls', function(req, res, next) {
  Poll.find(function(err, polls){
    if(err){
      return next(err);
    }

    res.json(polls);
  });
});

router.put('/polls/:poll', auth, function(req, res, next) {

  Poll.save()(function(err, poll){
    if(err){return next(err);}
    res.json(poll);
  });
});

router.delete('/polls/:poll', auth, function(req, res, next) {
  Poll.remove({ _id: req.params.poll }, function(err, poll){
    if(err){return next(err);}
    res.json({message: 'Successfully deleted'});
  });
});


module.exports = router;
