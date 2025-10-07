/*  SyncBeats – main.js  (ES-module, GitHub-Pages ready)
    1.  Loads MP3s from  ./audio/SoundHelix-Song-N.mp3
    2.  Everything else identical to previous explanation
*/
import * as Y from 'https://cdn.skypack.dev/yjs@13.5.52';
import { WebrtcProvider } from 'https://cdn.skypack.dev/y-webrtc@10.0.8';

// ---------- CONFIG ----------
const ROOM = location.hash.slice(1) || 'syncbeats-public';
const SIGNALLING = 'wss://y-webrtc-signaling-eu.herokuapp.com';
const TRACKS = [
  {title:'Midnight Drive',  artist:'Aurora Synthwave',  album:'Neon Dreams',  duration:252, cover:'https://source.unsplash.com/random/400x400?synthwave'},
  {title:'Electric Dreams', artist:'Neon Pulse',        album:'Future Sounds', duration:225, cover:'https://source.unsplash.com/random/400x400?neon'},
  {title:'Night Drive',     artist:'Synthwave Collective',album:'Urban Nights',duration:252, cover:'https://source.unsplash.com/random/400x400?night'}
];

// ---------- STATE ----------
let ydoc, provider, awareness;
let myPeerId;
let amHost = false;
let currentTrack = 0;
let audio = new Audio();
audio.volume = .75;

// ---------- DOM ----------
const $ = id => document.getElementById(id);
$('volume-slider').oninput = e => { audio.volume = e.target.value/100; $('volume-percent').textContent = e.target.value+'%'; };
$('play-pause-btn').onclick = togglePlay;
$('next-btn').onclick = () => changeTrack((currentTrack+1)%TRACKS.length);
$('prev-btn').onclick  = () => changeTrack((currentTrack-1+TRACKS.length)%TRACKS.length);
$('chat-send').onclick = sendChat;
$('chat-input').onkeypress = e => e.key==='Enter' && sendChat();

// ---------- INIT ----------
async function init(){
  ydoc = new Y.Doc();
  provider = new WebrtcProvider(ROOM, ydoc, { signaling:[SIGNALLING] });
  awareness = provider.awareness;

  awareness.setLocalStateField('user',{
    name:localStorage.getItem('username')||'Anon'+Math.floor(Math.random()*100),
    colour:randomColour()
  });

  provider.on('status', evt => {
    $('connection-status').textContent = evt.status==='connected' ? '● Connected' : '● Connecting…';
  });

  awareness.on('change', renderMembers);
  ydoc.getMap('sync').observe(renderSync);

  const sync = ydoc.getMap('sync');
  if(sync.get('track')!==undefined) currentTrack = sync.get('track');
  if(sync.get('playing')) { audio.currentTime = sync.get('time'); audio.play(); }
  loadTrack(currentTrack);

  audio.ontimeupdate = () => {
    if(Math.abs(audio.currentTime - (sync.get('time')||0))>2)
      sync.set('time', audio.currentTime);
  };
  audio.onplay = audio.onpause = () => sync.set('playing', !audio.paused);
  ydoc.getArray('chat').observe(renderChat);

  renderMembers(); renderSync(); renderChat();
}
init();

// ---------- SYNC ----------
function togglePlay(){
  audio.paused ? audio.play() : audio.pause();
  ydoc.getMap('sync').set('playing', !audio.paused);
}
function changeTrack(idx){
  currentTrack = idx;
  ydoc.getMap('sync').set('track', idx);
  loadTrack(idx);
}
function loadTrack(idx){
  const t = TRACKS[idx];
  $('typed-title').textContent = t.title;
  $('artist-name').textContent = t.artist;
  $('album-name').textContent  = `${t.album} • 2024`;
  $('album-cover').src = t.cover;
  $('total-time').textContent = fmtTime(t.duration);
  // ======  NEW: local MP3  ======
  audio.src = `audio/SoundHelix-Song-${idx+1}.mp3`;
  audio.currentTime = 0;
  renderProgress();
}

// ---------- RENDER ----------
function renderMembers(){
  const states = Array.from(awareness.getStates().values());
  $('member-count').textContent = states.length;
  const box = $('members-list'); box.innerHTML='';
  states.forEach((s,i)=>{
    const u = s.user;
    const div = document.createElement('div'); div.className='flex-shrink-0 text-center';
    div.innerHTML = `
      <div class="w-16 h-16 rounded-full flex items-center justify-center mb-1" style="background:${u.colour}">
        <span class="text-white font-bold">${u.name[0]}</span>
      </div>
      <p class="text-xs text-gray-300">${u.name}${i===0?' (Host)':''}</p>`;
    box.appendChild(div);
  });
}
function renderSync(){
  const sync = ydoc.getMap('sync');
  if(sync.get('track')!==undefined && sync.get('track')!==currentTrack) loadTrack(sync.get('track'));
  if(sync.get('playing')!==undefined && sync.get('playing')!==!audio.paused) togglePlay();
  if(sync.get('time')!==undefined && Math.abs(sync.get('time')-audio.currentTime)>2) audio.currentTime = sync.get('time');
  renderProgress();
}
function renderProgress(){
  const t = audio.currentTime, d = audio.duration||TRACKS[currentTrack].duration;
  $('current-time').textContent = fmtTime(t);
  $('progress-bar').style.width = (t/d*100)+'%';
  $('progress-handle').style.setProperty('--progress', (t/d*100)+'%');
}
function renderChat(){
  const arr = ydoc.getArray('chat');
  const box = $('chat-box'); box.innerHTML='';
  arr.forEach(item=>{
    const div = document.createElement('div'); div.className='flex items-start gap-2';
    div.innerHTML = `
      <span class="text-xs font-bold" style="color:${item.colour}">${item.name}:</span>
      <span class="text-sm text-gray-200">${item.text}</span>`;
    box.appendChild(div);
  });
  box.scrollTop = box.scrollHeight;
}

// ---------- CHAT ----------
function sendChat(){
  const input = $('chat-input');
  const text = input.value.trim(); if(!text)return;
  const user = awareness.getLocalState().user;
  ydoc.getArray('chat').push([{name:user.name, colour:user.colour, text}]);
  input.value='';
}

// ---------- HELPERS ----------
function fmtTime(s){const m=Math.floor(s/60);const sec=Math.floor(s%60);return `${m}:${sec.toString().padStart(2,'0')}`;}
function randomColour(){return `hsl(${Math.random()*360},70%,60%)`;}
