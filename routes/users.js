var express = require('express');
var router = express.Router();
var mongo = require('mongodb');
var objectId = require('mongodb').ObjectID;
var multer  = require('multer');
var upload = multer({ dest: './dist/images' });
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('../models/user');

// Signup
router.get('/signup', function (req, res) {
	res.render('signup');
});

// Login
router.get('/login', function (req, res) {
	res.render('login');
});

// Signup User
router.post('/signup', function (req, res) {	
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;

	// Validation	
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

	var errors = req.validationErrors();

	if (errors) {
		res.render('signup', {
			errors: errors
		});
	}
	else {
		//checking for email and username are already taken
		User.findOne({ username: { 
			"$regex": "^" + username + "\\b", "$options": "i"
	}}, function (err, user) {
			User.findOne({ email: { 
				"$regex": "^" + email + "\\b", "$options": "i"
		}}, function (err, mail) {
				if (user || mail) {
					res.render('signup', {
						user: user,
						mail: mail
					});
					console.log('1');
				}
				else {
					console.log('2');
					var newUser = new User({						
						email: email,
						username: username,
						password: password,
						user_profile:{}
					});
					User.createUser(newUser, function (err, user) {
						if (err) throw err;
						//console.log(user);
						console.log('3');
					});
         	req.flash('success_msg', 'You are registered and can now login');
					res.redirect('/users/login');
				}
			});
		});
	}
});

// Get profile profile
//router.get('/profile', ensureAuthenticated, function(req, res){
//	User.findOne({username:req.user.username}, function(err, user){
//		console.log(user.user_profile.description)
//		if(err) throw err;
//		res.render('profile', {user:user});		
//	});	
//});

router.get('/profile', ensureAuthenticated, function(req, res){
	User.findOne({username:req.user.username}, function(err, user){		
		//console.log(user.user_profile[0].profilepic)		
		if(err) throw err;
		res.render('profile', {user:user, user_description: user.user_profile[0].description, user_pic: user.user_profile[0].profilepic});
	});
});

// Get profile profile
router.get('/editprofile', ensureAuthenticated, function(req, res){
	User.findOne({username:req.user.username}, function(err, user){				
		//console.log(user);
		res.render('editprofile',{user:user, user_description: user.user_profile[0].description,  user_pic: user.user_profile[0].profilepic});
	});
});


// Update profile
router.post('/editprofile', ensureAuthenticated, function(req, res){
		var username = req.body.mata;
		var description = req.body.description;
	
	var id = req.body.id;
	console.log(username);
	console.log(description);
	//console.log(description);
	
	//if(req.file){
	//	var profileimage = req.file.filename;
	//}else{
	//	var profileimage = "dummy.jpg";
	//}

	User.updateOne({username: req.user.username},{$set: {"username":username, "user_profile": [{"description":description}]}},function(err, user){
		//console.log(user);
		if (err) throw err;		
		res.redirect('profile');
	});
});

passport.use(new LocalStrategy(
	function (username, password, done) {
		User.getUserByUsername(username, function (err, user) {
			if (err) throw err;
			if (!user) {
				return done(null, false, { message: 'Unknown User' });
			}

			User.comparePassword(password, user.password, function (err, isMatch) {
				if (err) throw err;
				if (isMatch) {
					return done(null, user);
				} else {
					return done(null, false, { message: 'Invalid password' });
				}
			});
		});
	}));

passport.serializeUser(function (user, done) {
	done(null, user.id);
});

passport.deserializeUser(function (id, done) {
	User.getUserById(id, function (err, user) {
		done(err, user);
	});
});

router.post('/login',
	passport.authenticate('local', { successRedirect: '/', failureRedirect: '/users/login', failureFlash: true }),
	function (req, res) {
		res.redirect('/');
	});

router.get('/logout', function (req, res) {
	req.logout();

	req.flash('success_msg', 'You are logged out');

	res.redirect('/users/login');
});

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		//req.flash('error_msg','You are not logged in');
		res.redirect('/users/login');
	}
} 
module.exports = router;