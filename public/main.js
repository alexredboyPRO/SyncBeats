// main.js
const socket = io();
let roomId = new URLSearchParams(location.search).get('room');
if (!roomId) {
  roomId = Math.random().toString(36).slice(2, 8);
  history.replaceState({}, '', '?room=' + roomId);
}
document.getElementById('room').textContent = roomId;

const audio = new Audio();
audio.volume = 0.7;

let isHost = false;
let isPlaying = false;

// join room
const name = prompt('Your name:') || 'Anonymous';
socket.emit('join', { roomId, name }, ({ ok, state }) => {
  if (!ok) return alert('Room full');
  isHost = state.hostId === socket.id;
  applyState(state);
});

socket.on('sync', state => applyState(state));
socket.on('member-joined', ({ name }) => addChat(`${name} joined`, 'system'));
socket.on('member-left', () => addChat('Someone left', 'system'));

function applyState({ playing, time, track }) {
  if (track) {
    audio.src = track.mp3;
    document.getElementById('title').textContent = track.title;
    document.getElementById('artist').textContent = track.artist;
  }
  audio.currentTime = time;
  playing ? audio.play() : audio.pause();
  isPlaying = playing;
  updateBtn();
}

// controls
document.getElementById('pp').onclick = () => {
  isPlaying = !isPlaying;
  updateBtn();
  socket.emit('sync', { playing: isPlaying, time: audio.currentTime, track: null });
};
document.getElementById('next').onclick = () => {
  audio.currentTime = 0;
  socket.emit('sync', { playing: true, time: 0, track: null });
};

function updateBtn() {
  document.getElementById('pp').textContent = isPlaying ? '❚❚' : '▶';
}

// progress
audio.ontimeupdate = () => {
  const cur = Math.floor(audio.currentTime);
  const dur = Math.floor(audio.duration || 0);
  document.getElementById('cur').textContent = fmt(cur);
  document.getElementById('dur').textContent = fmt(dur);
  document.getElementById('prog').style.width = dur ? (cur / dur * 100) + '%' : '0%';
};

// volume
document.getElementById('vol').oninput = e => {
  audio.volume = e.target.value / 100;
  document.getElementById('volLbl').textContent = e.target.value + '%';
};

// chat
document.getElementById('send').onclick = () => sendMsg();
document.getElementById('msg').onkeypress = e => e.key === 'Enter' && sendMsg();

function sendMsg() {
  const input = document.getElementById('msg');
  const msg = input.value.trim();
  if (!msg) return;
  addChat(`${name}: ${msg}`, 'user');
  input.value = '';
}
function addChat(text, type) {
  const box = document.getElementById('chat');
  const div = document.createElement('div');
  div.className = type === 'user' ? 'text-violet-300' : 'text-gray-400 italic';
  div.textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

// helpers
functionfmt(s){const m=Math.floor(s/60);return m+':'+(s%60).toString().padStart(2,'0');}
