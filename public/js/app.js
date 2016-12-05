var server;

// Upon loading all resources init the communication channel
window.addEventListener("load", function(event) {
    console.log("Loading complete!");

    server = io();
    setupServerListeners(server);
});

function setupServerListeners (server){
	server.on('message', function(data){
		console.log(data);
	});
}
