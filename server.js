'use strict';

const express = require('express');
const socketIO = require('socket.io');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const io = socketIO(server);

// ESTO ES UN ARRAY 2
var users_client = []; // List<List<User>>

const getOnlineUsers = () => users_client.map(user => ({ UserId: user.user_id, IsActive: user.is_active }));
		
io.on('connection', (socket) => {
	console.log(socket.id + ' Client connected');
	//test if data it's correct
	socket.on("f1data", function (data) {
			io.emit("f1data", data);
	console.log('f1 data event');
	});
	socket.on("iRacingdata", function (data) {
			io.emit("iRacingdata", data);
	console.log('iRacing data event');
	});
	// when a client connects, emit an event with the current online users
	// only send this to the connecting client as they are not actually logged in yet.
	socket.emit("refreshOnlineUsers", getOnlineUsers());
	socket.on("logIn", (id) => {

		// add user to online users with inactive/idle status
		let user = { user_id: id, socket_id: socket.id, is_active: false };
		const index = users_client.findIndex(user => user.user_id === id);

		if (index === -1) {
			console.log(socket.id + ' User: ' + user.user_id + ' does not exist so add to logged in users');
			users_client.push(user);
		}
		else {
			console.log(socket.id + ' User: ' + user.user_id + ' exists so update logged in users');
			users_client[index].socket_id = socket.id;
		}

		console.log(socket.id + ' User: ' + user.user_id + ' logged in');
		console.log(users_client);

		// now broadcast an update to all clients as the new client is logged in
		io.emit("refreshOnlineUsers", getOnlineUsers());
		console.log(socket.id + ' refresh online users');
	});

	socket.on('logOut', () => {
		console.log(socket.id + ' logout');
		removeUser();
	});

	socket.on('disconnect', () => {
		console.log(socket.id + ' Client disconnected');
		removeUser();
	});

	var removeUser = () => {
		const index = users_client.findIndex(user => user.socket_id === socket.id);

		console.log(socket.id + ' Attempt to remove user - index: ' + index);
		if (index != -1) {
			users_client.splice(index, 1);
			console.log(socket.id + ' User removed');
			console.log(users_client);
		}

		// broadcast to all users that a client has logged out/disconnected
		io.emit("refreshOnlineUsers", getOnlineUsers());
	}

	socket.on('updateUserStatus', (userToUpdate) => {

		console.log(socket.id + ' Attempt to update user :' + userToUpdate.UserId + ' status to: ' + userToUpdate.IsActive);

		const index = users_client.findIndex(user => user.user_id === userToUpdate.UserId);

		if (index !== -1) {
			
			users_client[index].is_active = userToUpdate.IsActive;
			console.log(socket.id + ' User :' + userToUpdate.UserId + ' status updated');

			// broadcast to all users that a user's status has updated
			io.emit("refreshOnlineUsers", getOnlineUsers());
		}		
	});

	socket.on("refreshUsers", () => {
		io.emit("refreshUsers");
		console.log(socket.id + ' update users event');
	});

	socket.on("f1data", function (data) {
		io.emit("f1data", data);
		//console.log('f1 data event');
	});
	
	socket.on("refreshStrategies", () => {
		io.emit("refreshStrategies");
		console.log(socket.id + ' update strategy event');
	});
	
	socket.on("refreshLaps", () => {
		io.emit("refreshLaps");
		console.log(socket.id + ' update laps event');
	});

	socket.on("refreshDriverTimes", () => {
		io.emit("refreshDriverTimes");
		console.log(socket.id + ' update driver times event');
	});

	socket.on("refreshTickets", () => {
		io.emit("refreshTickets");
		console.log(socket.id + ' update tickets event');
	});

	socket.on("refreshMotecData", () => {
		io.emit("refreshMotecData");
		console.log(socket.id + ' update Motec Data');
	});

	
});
