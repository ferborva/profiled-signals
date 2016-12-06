const socketIo = require('socket.io');
const uuid = require('uuid/v4');

let rooms = {};
let teachers = {};
let students = {};
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

            setupNewPeer(data, socket).then(() => {
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
            }).then(() => {
            	tryPeerConnections(socket);
            });
        });

        socket.on('disconnect', function(data) {
            // Manage peer disconnection
            // Remove socket saved details from registry
            switch (socket.type) {
            	case 'teacher':
            		delete teachers[socket.id];
		            if (socket.room) {
		            	delete rooms[socket.room].teacher;
		            }
		            console.log('VR:: Teacher exited from '.concat(socket.room, ' room'));
            		break;
            	case 'student':
            		delete students[socket.id];
            		if (socket.room) {
		            	delete rooms[socket.room].students[socket.id];
		            }
		            console.log('VR:: Student exited from '.concat(socket.room, ' room'));
            		break;
            	case 'screen':
            		delete screens[socket.id];
            		if (socket.room) {
		            	delete rooms[socket.room].screens[socket.id];
		            }
		            console.log('VR:: Screen exited from '.concat(socket.room, ' room'));
            		break;
            }

        });

        socket.on('leaveRoom', function(data) {
            // Manage room leaving
        });

        socket.on('peerReady', function(data) {
        	var ready = false;
        	var link = rooms[socket.room].links[data.id];
        	if (data.type === 'caller') {
        		link.callerReady = true;
        		if (link.receiverReady) {
        			ready = true;
        		}
        	} else {
        		link.receiverReady = true;
        		if (link.callerReady) {
        			ready = true;
        		}
        	}
        	if (ready) {
        		link.caller.emit('initConnection', {id: data.id});
        	}

        });

        socket.on('offer', function(data) {
            // Manage p2p offer transfer
            var receiver = rooms[socket.room].links[data.id].receiver;
            receiver.emit('offer', data);
        });

        socket.on('answer', function(data) {
            // Manage p2p answer transfer
            var caller = rooms[socket.room].links[data.id].caller;
            caller.emit('answer', data);
        });

        socket.on('iceCandidate', function(data) {
            // Manage ICE Candidate transfer
            var endpoint = rooms[socket.room].links[data.id][data.endpoint];
            endpoint.emit('iceCandidate', data);
        });

    });
}


function setupNewPeer(data, socket){
	return new Promise((resolve, reject) => {
		if (!data) {
			return reject('Registration details required (username and room)');
		}

		if (!data.name) {
			return reject('Username required');
		}

		if (!data.room) {
			return reject('Room name/id required');
		}

		// Minimum data required received
		let type = data.type || 'student';

		if (rooms[data.room]) {
			console.log(`VR:: ${data.name} entering an existing room`);
		} else {
			console.log(`VR:: ${data.name} is the first user to enter the room with ID: ${data.room}`);
			rooms[data.room] = {};
		}


		let room = rooms[data.room];
		room.links = room.links || {};

		// Save a reference of the socket and its user
		switch (type){
			case 'student':
				students[socket.id] = {
					socket: socket,
					name: data.name,
					room: data.room
				};

				room.students = room.students || {};

				var userData = {
					socket: socket,
					name: data.name,
					screenlink: null,
				};

				room.students[socket.id] = userData;

				console.log('VR:: Registered a student PEER');
				break;
			case 'teacher':
				if (room.teacher) {
					reject('VR:: ERROR :: A room can only have one teacher registered to it');
					return;
				}

				var userData = {
					socket: socket,
					name: data.name,
					room: data.room
				};

				teachers[socket.id] = userData;
				room.teacher = userData;

				console.log('VR:: Registered a teacher PEER');
				break;
			case 'screen':
				screens[socket.id] = {
					socket: socket,
					name: data.name
				};

				room.screens = room.screens || {};

				var screenData = {
					socket: socket,
					name: data.name,
					screenlink: null,
					reserved: false
				};

				room.screens[socket.id] = screenData;
				console.log('VR:: Registered a screen PEER');
				break;
			default:
				reject('No registration type found');
				return;
				break;
		}

		// Save socket type and location details to remove on unexpected closing
		socket.room = data.room;
		socket.type = type;

		resolve();


	});
}


function tryPeerConnections(socket) {
	if (socket.type === 'student') {
		// Ask for a free screen
		let screen = getFreeScreen(socket.room);
		if (screen) {
			// Set state of the screen as reserved in order to avoid other peers from requesting it
			rooms[socket.room].screens[screen.socket.id].reserved = true;

			var newLinkId = uuid();
			rooms[socket.room].links[newLinkId] = {
				caller: socket,
				receiver: screen.socket,
				callerReady: false,
				receiverReady: false
			};
			socket.emit('prepareConnection', {
				linkId: newLinkId,
				responsability: 'caller',
				config: {
					audio: true,
					video: true
				}
			});
			screen.socket.emit('prepareConnection', {
				linkId: newLinkId,
				responsability: 'receiver',
				config: {
					audio: true,
					video: true
				}
			})
		}
	}
	return;
}

function getFreeScreen(room){
	const screens = rooms[room].screens;
	console.log('Screens: ');
	console.log(screens);
	let available;
	if (screens) {

		for (let screen in screens) {
			console.log(screen);
			if (!screens[screen].screenlink && !screens[screen].reserved) {
				available = screens[screen];
				break;
			}
		}
		return available;
	}
	return null;
}