//My Modules
const socketService = require('./app/sockets.js');

// Generic Modules and setup
const fs = require('fs');
const http = require('http');
const https = require('https');
const morgan = require('morgan');

const argv = require('minimist')(process.argv.slice(2), {
	default: {
		port: 3000,
		secure: false
	}
});

const express = require('express');
const app = express();
let server;

if (argv.secure) {
	const options = {
	  key: fs.readFileSync('./certs/file.pem'),
	  cert: fs.readFileSync('./certs/file.crt')
	};

	server = https.createServer(options, app);
} else {
	server = http.Server(app);
}

const io = require('socket.io')(server);

app.use(morgan('dev'));
app.use(express.static('public'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

socketService(io);

server.listen(argv.port, function() {
  console.log('server up and running at %s port', argv.port);
});