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
		console.log('New Connection creation requested: ');
		console.log(data);
		var peer = BUZZ.RTC.createPeerConnection(data);
		console.log(peer);

		BUZZ.RTC.setupPeerConnectionListeners(peer);
		if (data.config) {
			BUZZ.RTC.getUserMedia(data.config).then(function(stream){
				peer.peerObject.addStream(stream);
			}).catch(function(err){
				console.log('Error on getUserMedia call');
			})
		}
	});

	server.on('offer', function(data){
		// Manage new Peer offer
	});

	server.on('answer', function(data) {
		// Manage new Peer answer
	})

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
				BUZZ.Utils.unsetLoading();
				BUZZ.Utils.alertError(err);
				return console.log('Error during registration');
			}

			console.log(resp.msg);
			BUZZ.Utils.unsetLoading();
			BUZZ.Utils.setStatus('in');
		}
		BUZZ.server.emit('register', opts, callback);
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
	},

	alertError: function(msg){
		window.alert(msg);
	}

};


BUZZ.RTC = {

	peers: {},

	localStreams: {},

	createPeerConnection: function(data) {
		var newPeerConnection = RTCPeerConnection(null);
		return BUZZ.RTC.peers[data.linkId] = {
			peerObject: newPeerConnection,
			responsability: data.responsability,
			config: data.config,
			streams: []
		};
	},

	setupPeerConnectionListeners: function(peerInfo){
		console.log(peerInfo.peerObject);
	},

	getUserMedia: function(config){
		return new Promise(function(resolve, reject) {
			window.navigator.getUserMedia(config, function(stream){
				console.log('Local Stream correctly obtained');
				BUZZ.RTC.localStreams[JSON.stringify(config)] = stream;
				resolve(stream);
			}, function(err){
				console.log('Error:: Issue trying to get local stream. Probably permission has been denied');
				reject(err);
			});
		});
	}
}