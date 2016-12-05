const socketIo = require('socket.io');
const uuid = require('uuid/v4');

let rooms = {};
let users = {};
let screens = {};

let virtualRoomNsp;

module.exports = function(io) {
    virtualRoomNsp = io.of('virtual-room');

    virtualRoomNsp.on('connection', function(socket) {
        console.log('VIRTUAL ROOM CONNECTION:: New Socket setup');
        socket.emit('message', 'Server socket setup correctly.');

        socket.on('register', function(data, callback) {
            // Mange new peer registration
            console.log('VR:: New peer registration');
            console.log(data);

            setupNewPeer(data).then(() => {
            	// Peer setup worked
            	const res = {
            		msg: 'Registration process completed'
            	}
            	callback(null, res);
            }, (err) => {
            	// Log Error
            	console.log('VR:: ERROR :: Peer setup process error');
            	console.log(err);
            	// Callback invocation
            	callback(err);
            });
        });

        socket.on('disconnect', function(data) {
            // Manage peer disconnection
        });

        socket.on('leaveRoom', function(data) {
            // Manage room leaving
        });

        socket.on('offer', function(data) {
            // Manage p2p offer transfer
        });

        socket.on('answer', function(data) {
            // Manage p2p answer transfer
        });

        socket.on('iceCandidate', function(data) {
            // Manage ICE Candidate transfer
        });

    });
}


function setupNewPeer(data){
	return new Promise((resolve, reject) => {
		resolve();
	})
}