// server.js
const app    = require('express')();
const server = require('http').createServer(app);
const io     = require('socket.io')(server, { cors:{ origin:"*" } });
const { v4 } = require('uuid');

app.use(require('cors')());
app.use(require('express').static('public'));   // serve front-end

const rooms = new Map();   // roomId -> {hostId, members:Map(), track:{}, time:0, playing:false}

io.on('connection', socket => {
  socket.on('join', ({roomId, name}, cb) => {
    if (!rooms.has(roomId)) {          // auto-create room
      rooms.set(roomId, {
        hostId: socket.id,
        members: new Map(),
        track: { id:1, title:"Midnight Drive", artist:"Aurora Synthwave", mp3:"https://cdn.pixabay.com/download/audio/2022/05/27/audio_xxx.mp3" },
        time:0,
        playing:false
      });
    }
    const room = rooms.get(roomId);
    if (room.members.size >= 20) return cb({ok:false, msg:'Room full'});
    socket.join(roomId);
    room.members.set(socket.id, {id:socket.id, name, isHost:socket.id===room.hostId});
    socket.roomId = roomId;
    cb({ok:true, state:room});
    socket.to(roomId).emit('member-joined', {name});
  });

  socket.on('sync', state => {               // host broadcasts play/pause/seek
    const room = rooms.get(socket.roomId);
    if (!room) return;
    Object.assign(room, state);
    socket.to(socket.roomId).emit('sync', state);
  });

  socket.on('disconnect', () => {
    const room = rooms.get(socket.roomId);
    if (!room) return;
    room.members.delete(socket.id);
    socket.to(socket.roomId).emit('member-left', socket.id);
    if (room.members.size === 0) rooms.delete(socket.roomId);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅  http://localhost:${PORT}`));
