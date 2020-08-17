// imports

window.addEventListener('load', () => {
	// DOM elements.
	const videoGrid = document.getElementById('video-grid')
	const clientVideo = document.createElement('video')
	clientVideo.muted = true
	const messageGrid = document.getElementById('message-grid')
	const formChatMessage = document.getElementById('panel-footer');
	const msgChatElement = document.getElementById('msg-chat')

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
	const username = localStorage.getItem('username');
	let UserId

	// Video Chat part
	//=============================
	launchAfterFaceModel(navigator.mediaDevices.getUserMedia({
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
	}))

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

		// Face detection (UNCOMMENT HERE)
		//===========================
		// Uncomment this part for use face detéction (Caution: For now face detection are not fix!)
		//===========================
		//video.addEventListener('play', () => {
		//	const canvas = faceapi.createCanvasFromMedia(video)
		//	videoGrid.append(canvas)
		//	const displaySize = { width: 700, height: 500 }
		//	setInterval(async () => {
		//		const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()
		//		const resizedDetections = faceapi.resizeResults(detections, displaySize)
		//		canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
		//		faceapi.draw.drawDetections(canvas, resizedDetections)
		//		faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
		//		faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
		//	}, 700)
		//})

		video.classList.add('col-md-4')
		videoGrid.append(video)
	}
	// End Video Chat
	//=============================

	// Chat Message part
	// ============================
	formChatMessage.addEventListener('submit', (e) => {
		e.preventDefault()
		sendMessage()
	})

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

	// Face Detection part
	//=============================
	console.log(faceapi.nets)

	function launchAfterFaceModel(event) {
		Promise.all([
			faceapi.nets.tinyFaceDetector.loadFromUri('/js/face-api-models'),
			faceapi.nets.faceLandmark68Net.loadFromUri('/js/face-api-models'),
			faceapi.nets.faceRecognitionNet.loadFromUri('/js/face-api-models'),
			faceapi.nets.faceExpressionNet.loadFromUri('/js/face-api-models'),
		]).then(event)
	}

});
