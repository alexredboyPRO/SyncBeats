// SyncBeats - Main JavaScript File
// Handles music synchronization, group management, and interactive features

class SyncBeats {
    constructor() {
        this.isPlaying = false;
        this.currentTrack = 0;
        this.groupMembers = [];
        this.queue = [];
        this.isHost = false;
        this.currentGroup = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeAnimations();
        this.setupWebSocketSimulation();
        this.loadMockData();
    }

    setupEventListeners() {
        // Play/Pause button
        const playPauseBtn = document.getElementById('play-pause-btn');
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => this.togglePlayback());
        }

        // Volume controls
        const volumeSliders = document.querySelectorAll('input[type="range"]');
        volumeSliders.forEach(slider => {
            slider.addEventListener('input', (e) => this.updateVolume(e.target.value));
        });

        // Group join buttons
        const joinButtons = document.querySelectorAll('.join-group-btn');
        joinButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.joinGroup(e.target.dataset.groupId));
        });

        // Host controls
        const hostControls = document.querySelectorAll('.host-control');
        hostControls.forEach(control => {
            control.addEventListener('click', (e) => this.handleHostAction(e.target.dataset.action));
        });

        // Chat functionality
        const chatInputs = document.querySelectorAll('.chat-input');
        chatInputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage(e.target.value);
                    e.target.value = '';
                }
            });
        });

        // Navigation
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });
    }

    initializeAnimations() {
        // Animate elements on page load
        if (typeof anime !== 'undefined') {
            // Stagger animation for cards
            anime({
                targets: '.group-card, .dashboard-card',
                translateY: [50, 0],
                opacity: [0, 1],
                delay: anime.stagger(100),
                duration: 600,
                easing: 'easeOutElastic(1, .8)'
            });

            // Animate member avatars
            anime({
                targets: '.member-avatar',
                scale: [0, 1],
                opacity: [0, 1],
                delay: anime.stagger(100),
                duration: 600,
                easing: 'easeOutElastic(1, .8)'
            });
        }
    }

    setupWebSocketSimulation() {
        // Simulate real-time updates
        setInterval(() => {
            this.updateProgress();
            this.simulateMemberActivity();
        }, 1000);

        // Simulate incoming messages
        setInterval(() => {
            if (Math.random() < 0.3) {
                this.simulateChatMessage();
            }
        }, 15000);
    }

    loadMockData() {
        this.tracks = [
            {
                id: 1,
                title: "Midnight Drive",
                artist: "Aurora Synthwave",
                album: "Neon Dreams",
                duration: 252,
                artwork: "resources/album-art-1.jpg"
            },
            {
                id: 2,
                title: "Electric Dreams",
                artist: "Neon Pulse",
                album: "Future Sounds",
                duration: 225,
                artwork: "resources/album-art-2.jpg"
            },
            {
                id: 3,
                title: "Night Drive",
                artist: "Synthwave Collective",
                album: "Urban Nights",
                duration: 252,
                artwork: "resources/concert-stage.jpg"
            }
        ];

        this.groupMembers = [
            { id: 1, name: "AlexDevilish", isHost: true, status: "connected" },
            { id: 2, name: "Sarah", isHost: false, status: "connected" },
            { id: 3, name: "Mike", isHost: false, status: "connected" },
            { id: 4, name: "Emma", isHost: false, status: "away" },
            { id: 5, name: "Jake", isHost: false, status: "connected" }
        ];

        this.groups = [
            {
                id: 1,
                name: "Electronic Vibes",
                host: "AlexDevilish",
                members: 5,
                maxMembers: 8,
                currentTrack: "Midnight Drive - Aurora Synthwave",
                genre: "Electronic"
            },
            {
                id: 2,
                name: "Indie Collective",
                host: "SarahMusic",
                members: 3,
                maxMembers: 6,
                currentTrack: "Lost in the Echo - Indie Dreams",
                genre: "Indie"
            }
        ];
    }

    togglePlayback() {
        this.isPlaying = !this.isPlaying;
        
        const playIcon = document.getElementById('play-icon');
        const pauseIcon = document.getElementById('pause-icon');
        
        if (this.isPlaying) {
            playIcon?.classList.add('hidden');
            pauseIcon?.classList.remove('hidden');
        } else {
            playIcon?.classList.remove('hidden');
            pauseIcon?.classList.add('hidden');
        }

        // Animate button
        if (typeof anime !== 'undefined') {
            anime({
                targets: '#play-pause-btn',
                scale: [1, 1.1, 1],
                duration: 300,
                easing: 'easeOutElastic(1, .8)'
            });
        }

        // Broadcast to group members
        this.broadcastPlaybackState();
    }

    updateProgress() {
        const progressBar = document.querySelector('.progress-bar');
        const currentTimeEl = document.getElementById('current-time');
        
        if (progressBar && currentTimeEl && this.isPlaying) {
            const currentTime = this.parseTime(currentTimeEl.textContent);
            const newTime = currentTime + 1;
            const totalTime = this.tracks[this.currentTrack]?.duration || 252;
            
            if (newTime <= totalTime) {
                const minutes = Math.floor(newTime / 60);
                const seconds = newTime % 60;
                currentTimeEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                
                const progress = (newTime / totalTime) * 100;
                progressBar.style.width = `${progress}%`;
            }
        }
    }

    parseTime(timeString) {
        const [minutes, seconds] = timeString.split(':').map(Number);
        return minutes * 60 + seconds;
    }

    updateVolume(value) {
        // Update volume display
        const volumeDisplay = document.querySelector('.volume-percentage');
        if (volumeDisplay) {
            volumeDisplay.textContent = `${value}%`;
        }

        // Animate volume change
        if (typeof anime !== 'undefined') {
            anime({
                targets: '.volume-slider',
                scale: [1, 1.05, 1],
                duration: 200,
                easing: 'easeOutQuad'
            });
        }
    }

    joinGroup(groupId) {
        const group = this.groups.find(g => g.id == groupId);
        if (group && group.members < group.maxMembers) {
            // Simulate joining group
            this.showNotification(`Joined ${group.name}!`, 'success');
            
            // Update UI
            const button = document.querySelector(`[data-group-id="${groupId}"]`);
            if (button) {
                button.textContent = 'Joined!';
                button.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                
                setTimeout(() => {
                    button.textContent = 'Join Group';
                    button.style.background = 'linear-gradient(135deg, #8b5cf6, #a855f7)';
                }, 2000);
            }
        }
    }

    sendMessage(message) {
        if (message.trim()) {
            const chatContainer = document.querySelector('.chat-messages');
            if (chatContainer) {
                const messageEl = document.createElement('div');
                messageEl.className = 'chat-message flex items-start space-x-3';
                messageEl.innerHTML = `
                    <div class="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span class="text-xs font-bold">You</span>
                    </div>
                    <div>
                        <p class="text-sm"><span class="text-violet-400 font-medium">You:</span> ${message}</p>
                        <p class="text-xs text-gray-500">Just now</p>
                    </div>
                `;
                
                chatContainer.appendChild(messageEl);
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        }
    }

    simulateChatMessage() {
        const messages = [
            { user: "Sarah", message: "This track is fire! 🔥", color: "emerald" },
            { user: "Mike", message: "Perfect timing for this song", color: "rose" },
            { user: "Emma", message: "Can we add more like this?", color: "amber" }
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        const chatContainer = document.querySelector('.chat-messages');
        
        if (chatContainer) {
            const messageEl = document.createElement('div');
            messageEl.className = 'chat-message flex items-start space-x-3';
            messageEl.innerHTML = `
                <div class="w-8 h-8 bg-${randomMessage.color}-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span class="text-xs font-bold">${randomMessage.user[0]}</span>
                </div>
                <div>
                    <p class="text-sm"><span class="text-${randomMessage.color}-400 font-medium">${randomMessage.user}:</span> ${randomMessage.message}</p>
                    <p class="text-xs text-gray-500">Just now</p>
                </div>
            `;
            
            chatContainer.appendChild(messageEl);
            chatContainer.scrollTop = chatContainer.scrollHeight;
            
            // Animate new message
            if (typeof anime !== 'undefined') {
                anime({
                    targets: messageEl,
                    translateY: [20, 0],
                    opacity: [0, 1],
                    duration: 300,
                    easing: 'easeOutQuad'
                });
            }
        }
    }

    simulateMemberActivity() {
        // Randomly update member status indicators
        const memberAvatars = document.querySelectorAll('.member-avatar::after');
        memberAvatars.forEach(avatar => {
            if (Math.random() < 0.1) { // 10% chance to toggle status
                avatar.style.background = avatar.style.background === 'rgb(239, 68, 68)' ? '#10b981' : '#ef4444';
            }
        });
    }

    broadcastPlaybackState() {
        // Simulate broadcasting playback state to group members
        console.log(`Broadcasting playback state: ${this.isPlaying ? 'playing' : 'paused'}`);
    }

    handleHostAction(action) {
        switch (action) {
            case 'pause-all':
                this.isPlaying = false;
                this.showNotification('Paused for all members', 'info');
                break;
            case 'next-track':
                this.nextTrack();
                break;
            case 'kick-member':
                this.showNotification('Member removed from group', 'warning');
                break;
            default:
                console.log('Unknown host action:', action);
        }
    }

    nextTrack() {
        this.currentTrack = (this.currentTrack + 1) % this.tracks.length;
        const track = this.tracks[this.currentTrack];
        
        // Update UI
        const titleEl = document.getElementById('typed-title');
        const artistEl = document.getElementById('artist-name');
        const albumEl = document.getElementById('album-name');
        const artworkEl = document.querySelector('.album-art img');
        
        if (titleEl && typeof Typed !== 'undefined') {
            new Typed('#typed-title', {
                strings: [track.title],
                typeSpeed: 50,
                showCursor: false
            });
        }
        
        if (artistEl) artistEl.textContent = track.artist;
        if (albumEl) albumEl.textContent = `${track.album} • 2024`;
        if (artworkEl) artworkEl.src = track.artwork;
        
        // Reset progress
        const progressBar = document.querySelector('.progress-bar');
        const currentTimeEl = document.getElementById('current-time');
        if (progressBar) progressBar.style.width = '0%';
        if (currentTimeEl) currentTimeEl.textContent = '0:00';
        
        this.showNotification(`Now playing: ${track.title}`, 'info');
    }

    handleNavigation(e) {
        // Add navigation animations
        if (typeof anime !== 'undefined') {
            anime({
                targets: e.target,
                scale: [1, 0.95, 1],
                duration: 200,
                easing: 'easeOutQuad'
            });
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm`;
        
        const colors = {
            success: 'bg-emerald-500',
            error: 'bg-red-500',
            warning: 'bg-amber-500',
            info: 'bg-violet-500'
        };
        
        notification.classList.add(colors[type] || colors.info);
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <span class="text-white text-sm font-medium">${message}</span>
                <button class="text-white/80 hover:text-white" onclick="this.parentElement.parentElement.remove()">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        if (typeof anime !== 'undefined') {
            anime({
                targets: notification,
                translateX: [300, 0],
                opacity: [0, 1],
                duration: 300,
                easing: 'easeOutQuad'
            });
        }
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (typeof anime !== 'undefined') {
                anime({
                    targets: notification,
                    translateX: [0, 300],
                    opacity: [1, 0],
                    duration: 300,
                    easing: 'easeOutQuad',
                    complete: () => notification.remove()
                });
            } else {
                notification.remove();
            }
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.syncBeats = new SyncBeats();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SyncBeats;
}