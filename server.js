const express = require('express')
const app = express()
const server = require('http').createServer(app);
const port = process.env.PORT || 3000
const io = require('socket.io')(server)
const { v4: uuid } = require('uuid')

app.use('/', express.static('public'))
app.set('view engine', 'ejs')

// Routing
const layout = 'layout/index'
app.get('/', (req, res) => {
	res.render(layout, {
		page: "Home"
	});
})

app.get('/video-chat/', (req, res) => { res.redirect(`/video-chat/${uuid()}`) })
app.get('/video-chat/:room', (req, res) => {
	res.render(layout, {
		page: 'VideoChat',
		roomId: 'VideoChat' + req.params.room
	});
})

app.get('/chat/', (req, res) => { res.redirect(`/chat/${uuid()}`) })
app.get('/chat/:room', (req, res) => {
	res.send('Chat room: ' + req.params.room)
})

app.get('*', (req, res) => {
	res.render(layout, {
		page: '404'
	});
})
// End routing

// WebSocket
io.on("connection", socket => {
	socket.on('join-room', (roomId, userId) => {
		socket.join(roomId);
		socket.to(roomId).broadcast.emit('user-connected', userId);

		socket.on('new-message', (roomId, msg) => {
			socket.to(roomId).broadcast.emit('message-sent', msg)
		})

		socket.on('disconnect', () => {
			socket.to(roomId).broadcast.emit('user-disconnected', userId)
		})
	});

});

server.listen(port);
console.log(`Your app run at http://localhost:${port}`)
