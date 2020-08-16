// imports

window.addEventListener('load', () => {
	// DOM elements.
	const videoGrid = document.getElementById('video-grid')
	const clientVideo = document.createElement('video')
	clientVideo.muted = true
	const messageGrid = document.getElementById('message-grid')
	const msgChatElement = document.getElementById('msg-chat')
	const BtnSenDMsg = document.getElementById('btn-send-msg')

	// Variables
	const socket = io()
	const clientPeer = new Peer({
		config: {
			'iceServers': [
				//{ url: 'turn:homeo@turn.bistri.com:80', credential: 'homeo' },
				{ url: 'stun:stun.l.google.com:19302' },
				{ url: 'stun:stun1.l.google.com:19302' },
				{ url: 'stun:stun2.l.google.com:19302' },
				{ url: 'stun:stun3.l.google.com:19302' },
				{ url: 'stun:stun4.l.google.com:19302' },
			]
		} /* Sample servers, please use appropriate ones */
	});
	const peers = {}
	let UserId

	// Video Chat part
	//=============================
	navigator.mediaDevices.getUserMedia({
		video: true,
		audio: true
	}).then(stream => {
		addVideoStream(clientVideo, stream)

		clientPeer.on('call', call => {
			call.answer(stream)
			const video = document.createElement('video')
			call.on('stream', userVideoStream => {
				addVideoStream(video, userVideoStream)
			})
		})

		socket.on('user-connected', userId => {
			connectToNewUser(userId, stream)
		})
	})

	socket.on('user-disconnected', userId => {
		if (peers[userId]) peers[userId].close()
	})

	clientPeer.on('open', id => {
		UserId = id
		socket.emit('join-room', ROOM_ID, UserId)
	})

	function connectToNewUser(userId, stream) {
		const call = clientPeer.call(userId, stream)
		const video = document.createElement('video')
		call.on('stream', userVideoStream => {
			addVideoStream(video, userVideoStream)
		})
		call.on('close', () => {
			video.remove()
		})

		peers[userId] = call
	}

	function addVideoStream(video, stream) {
		video.srcObject = stream
		video.addEventListener('loadedmetadata', () => {
			video.play()
		})
		video.classList.add('col-md-6')
		videoGrid.append(video)
	}
	// End Video Chat
	//=============================

	// Chat Message part
	// ============================
	BtnSenDMsg.onclick = () => {
		sendMessage()
	}

	function sendMessage() {
		if (msgChatElement.value) {
			socket.emit('new-message', ROOM_ID, msgChatElement.value)
			addMessageItem(msgChatElement.value)
			msgChatElement.value = ""
		} else {
			alert('The message field can\'t be empty!');
		}
	}

	socket.on('message-sent', (msg) => {
		addMessageItem(msg, false)
	});

	function addMessageItem(msg, isMine = true) {

		let message
		const d = new Date();
		const dateString = ("0" + d.getDate()).slice(-2) + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + d.getFullYear() + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);

		const dateSent = '<time datetime="' + dateString + '">' + dateString + '</time>'

		if (isMine) {
			message = '<div class="row msg_container base_sent"> <div class="col-10"> <div class="messages msg_sent"> <p>' + msg + '</p> ' + dateSent + ' </div> </div> <div class="col-2 avatar"> <img src="http://www.bitrebels.com/wp-content/uploads/2011/02/Original-Facebook-Geek-Profile-Avatar-1.jpg" class="img-fluid"> </div> </div>'
		} else {
			message = '<div class="row msg_container base_receive"> <div class="col-2 avatar"> <img src="http://www.bitrebels.com/wp-content/uploads/2011/02/Original-Facebook-Geek-Profile-Avatar-1.jpg" class="img-fluid"> </div> <div class="col-10"> <div class="messages msg_receive"> <p>' + msg + '</p> ' + dateSent + ' </div> </div> </div>'
		}
		messageGrid.innerHTML += message;
	}
		// End Chat Message
	//=============================

});
