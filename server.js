var fs = require('fs');
var http = require('http');
var https = require('https');
var argv = require('minimist')(process.argv.slice(2), {
	default: {
		port: 3000,
		secure: false
	}
});

var express = require('express');
var app = express();
var server;

if (argv.secure) {
	var options = {
	  key: fs.readFileSync('./certs/file.pem'),
	  cert: fs.readFileSync('./certs/file.crt')
	};

	server = https.createServer(options, app);
} else {
	server = http.Server(app);
}

var io = require('socket.io')(server);

app.use(express.static('public'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', function(socket) {
  console.log('new connection');
  socket.emit('message', 'This is a message from the dark side.');
});

server.listen(argv.port, function() {
  console.log('server up and running at %s port', argv.port);
});