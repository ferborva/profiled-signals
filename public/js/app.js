var BUZZ = {};
BUZZ.server = '';
BUZZ.peers = {};

var joinSection = document.getElementById('join-section');
var displaySection = document.getElementById('display-section');

// Upon loading all resources init the communication channel
window.addEventListener("load", function(event) {
    console.log("Loading complete!");

    BUZZ.server = io('/virtual-room');
    BUZZ.setupServerListeners(BUZZ.server);
});

BUZZ.setupServerListeners = function(server){
	server.on('message', function(data){
		// Log a message from the sever. Simple connection check
		console.log(data);
	});

	server.on('prepareConnection', function(data){
		// Manage new peer connection prep process
	});

	server.on('offer', function(data){
		// Manage new Peer offer
	});

	server.on('iceCandidate', function(data){
		// Manage receiving a new ICE Candidate
	});
}


BUZZ.Utils = {

	register: function(type){
		var opts = {
			type: type,
			name: BUZZ.Utils.getName(),
			room: BUZZ.Utils.getRoom()
		}
		var callback = function(err, resp) {
			if (err) {
				return console.log('Error during registration');
			}

			console.log(resp.msg);
			BUZZ.Utils.unsetLoading();
		}
		BUZZ.server.emit('register', opts, callback);
		BUZZ.Utils.setStatus('in');
		BUZZ.Utils.setLoading();
	},

	getName: function(){
		return document.getElementById('name-holder').value;
	},

	getRoom: function(){
		return document.getElementById('room-holder').value;
	},

	loader: document.getElementById('loader'),

	setLoading: function(){
		BUZZ.Utils.loader.hidden = false;
	},

	unsetLoading: function(){
		BUZZ.Utils.loader.hidden = true;
	},

	setStatus: function(status){
		if (status === 'in') {
			joinSection.hidden = true;
			displaySection.hidden = false;
		} else {
			joinSection.hidden = false;
			displaySection.hidden = true;
		}
	}

};