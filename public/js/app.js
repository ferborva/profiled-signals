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

		BUZZ.RTC.getUserMedia(data.config).then(function(stream){
			if (stream) {
				peer.peerObject.addStream(stream);
			}
			BUZZ.server.emit('peerReady', {id: peer.id, type: peer.responsability});
		}).catch(function(err){
			console.log('Error on getUserMedia call');
		});
	});

	server.on('initConnection', function(data){
		console.log('initializing connection');
		var peer = BUZZ.RTC.peers[data.id];
		BUZZ.RTC.initCall(peer);
	});

	server.on('offer', function(data){
		// Manage new Peer offer
		console.log('Received remote offer');
		BUZZ.RTC.handleOffer(data);
	});

	server.on('answer', function(data) {
		// Manage new Peer answer
		console.log('Received answer');
		BUZZ.RTC.handleAnswer(data);
	})

	server.on('iceCandidate', function(data){
		// Manage receiving a new ICE Candidate
		BUZZ.RTC.handleIceCandidate(data);
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
			BUZZ.Utils.prepViewZone(type);
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
	},

	prepViewZone: function(type){
		var titleEl = document.getElementById('view-title');
		var displaySection = document.getElementById('display-section');
		switch (type) {
			case 'teacher':
				titleEl.innerHTML = 'Teacher View';
				displaySection.classList = 'teacher';
				break;
			case 'student':
				titleEl.innerHTML = 'Student View';
				displaySection.classList = 'student';
				break;
			case 'screen':
				titleEl.innerHTML = 'Tile View';
				displaySection.classList = 'screen';
				break;
		}
	}

};


BUZZ.RTC = {

	peers: {},

	localStreams: {},

	ICE: {
	  'iceServers': [
	    {
	      'url': 'stun:stun.l.google.com:19302'
	    },
	    {
	      'url': 'turn:192.158.29.39:3478?transport=udp',
	      'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
	      'username': '28224511:1379330808'
	    },
	    {
	      'url': 'turn:192.158.29.39:3478?transport=tcp',
	      'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
	      'username': '28224511:1379330808'
	    }
	  ]
	},

	createPeerConnection: function(data) {
		var newPeerConnection = RTCPeerConnection(BUZZ.RTC.ICE);
		return BUZZ.RTC.peers[data.linkId] = {
			peerObject: newPeerConnection,
			responsability: data.responsability,
			config: data.config,
			streams: [],
			id: data.linkId,
			origin: data.origin || null
		};
	},

	setupPeerConnectionListeners: function(peerInfo){
		peerInfo.peerObject.onaddstream = function(stream){
			console.log(stream);
			console.log('received a new remote stream');
			var div = document.createElement('div');
			var vid = document.createElement('video');
			vid.autoplay = true;
			vid.controls = true;
			vid.muted = true;
			vid.id = peerInfo.id;
			vid.classList += ' ' + (peerInfo.origin || '');
			vid.src = window.URL.createObjectURL(stream.stream);
			var container = document.getElementById('display-section');
			div.appendChild(vid);
			container.appendChild(div);

			if (peerInfo.origin === 'teacher') {
				var span = document.createElement('span');
				span.innerHTML = 'Teacher\'s screen/camera';
				div.appendChild(span);
			} else if (peerInfo.origin === 'screen') {
				var span = document.createElement('span');
				span.innerHTML = 'Tile camera view';
				div.appendChild(span);
			}
		};

		peerInfo.peerObject.onicecandidate = function(ice){
			console.log(ice);
			BUZZ.server.emit('iceCandidate', {id: peerInfo.id, candidate: ice.candidate, endpoint: peerInfo.responsability === 'caller' ? 'receiver' : 'caller'});
		};
	},

	initCall: function(peer) {
		peer.peerObject.createOffer(function(offer){
			console.log('New offer created');
			peer.peerObject.setLocalDescription(offer);
			BUZZ.server.emit('offer', {id: peer.id, offer: offer});
		}, function(err){
			// Handle error
		});	
	},

	handleOffer: function(data){
		var peer = BUZZ.RTC.peers[data.id];
		peer.peerObject.setRemoteDescription(data.offer);
		peer.peerObject.createAnswer(function(answer){
			peer.peerObject.setLocalDescription(answer);
			BUZZ.server.emit('answer', {id: peer.id, answer: answer});
		}, function(err){
			// Handle answer creation error
		})
	},

	handleAnswer: function(data){
		var peer = BUZZ.RTC.peers[data.id];
		peer.peerObject.setRemoteDescription(data.answer);
	},

	handleIceCandidate: function(data) {
		var peer = BUZZ.RTC.peers[data.id];
		if (data.candidate) {
			peer.peerObject.addIceCandidate(new RTCIceCandidate(data.candidate)).then(function(){
				console.log('Ice Candidate added correctly');
			}, function(){
				console.log('Error on add remote ice candidate');
			});
		}
	},

	getUserMedia: function(config){
		return new Promise(function(resolve, reject) {
			if (!config) {
				return resolve(null);
			}
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