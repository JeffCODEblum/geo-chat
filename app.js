var express = require('express');	
var session = require('express-session');	
var bodyParser = require('body-parser');
var mongoose = require('mongoose');	
var app = express();
var http = require('http').Server(app);	
var path = require('path');	
var config = require('./config');
var io = require('socket.io')(http);

app.use(express.static(path.join(__dirname + '/public')));	
app.use(bodyParser.urlencoded({extended: false}));	
app.use(bodyParser.json());
app.use(session({secret: config.secret, resave: true, saveUninitialized: true}));
mongoose.connect("mongodb://localhost:27017/ig-accounts");	
app.set('secret', config.secret);

var users = [];
var posts = [];

var postSchema = mongoose.Schema({
	id: String,
	heading: String,
	body: String,
	coords: {
		longitude: Number,
		latitude: Number
	}
});
var PostModel = mongoose.model('postModel', postSchema);

PostModel.find({}, function(err, docs) {
	for (var i = 0; i < docs.length; i++) {
		console.log(docs[i]);
		posts.push(docs[i]);
	}
});

io.on('connection', function(socket) {
	console.log('user connected');
	socket.on('position', function(data) {
		console.log(data);
		console.log("user's position " + data.longitude + " " + data.latitude);
		users.push({
			id: socket.id,
			coords: data
		});
	});

	socket.on('update', function() {
		socket.emit('update', posts);
	});

	socket.on('post', function(data) {
		console.log(data);
		posts.push(data);
		var newPostModel = new PostModel({
			id: socket.id,
			heading: data.heading,
			body: data.body,
			coords: {
				longitude: data.coords.longitude,
				latitude: data.coords.latitude
			}
		});
		newPostModel.save(function(err, result) {
			err ? console.log(err) : console.log("saved");
		});
	});

	socket.on('disconnect', function() {
		for (var i = 0; i < users.length; i++) {
			if (users[i].id == socket.id) {
				users.splice(i, 1);
			}
		}
	});
})

// Start up the server
http.listen(3030, function() {
	console.log("listening on *:3030");
});

// Handle requests
app.post('/page1', function(req, res) {
	res.end("page 1 data");
});

app.post('/page2', function(req, res) {
	res.end("page 2 data");
});