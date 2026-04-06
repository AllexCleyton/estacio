/* ========================================
   SPOTIFY-LIKE EXPERIENCE - JAVASCRIPT
   ======================================== */

// ========================================
// ESTADO GLOBAL DA APLICAÇÃO
// ========================================

class MusicAppState {
    constructor() {
        this.currentView = 'home';
        this.isPlaying = false;
        this.currentTrack = null;
        this.volume = 70;
        this.currentTime = 0;
        this.duration = 240;
        this.isMuted = false;
        this.isShuffle = false;
        this.repeatMode = 0;
        this.favorites = new Set();
        this.likedPlaylists = new Set();
        this.queue = [];
        this.originalQueue = [];
        this.currentQueueIndex = 0;
        this.recentSearches = [];
        this.recentlyPlayed = [];
        this.libraryFilter = 'all';
        this.searchQuery = '';
        this.volumeBeforeMute = 70;
        
        this.tracks = [
            { id: 1, title: 'Noite Estrelada', artist: 'Luna Sky', duration: 245, year: 2024, genre: 'Pop', plays: 1250 },
            { id: 2, title: 'Ritmo da Cidade', artist: 'Urban Beats', duration: 252, year: 2024, genre: 'Hip-Hop', plays: 890 },
            { id: 3, title: 'Coração Selvagem', artist: 'Electric Dreams', duration: 198, year: 2024, genre: 'Eletrônico', plays: 2100 },
            { id: 4, title: 'Melody do Infinito', artist: 'Cosmic Sound', duration: 187, year: 2023, genre: 'Ambient', plays: 567 },
            { id: 5, title: 'Thunder Road', artist: 'Rock Legacy', duration: 234, year: 2023, genre: 'Rock', plays: 1890 },
            { id: 6, title: 'Sunset Paradise', artist: 'Tropical Vibes', duration: 210, year: 2024, genre: 'Reggae', plays: 1456 },
        ];
        
        this.playlists = [
            { id: 1, name: 'Minhas Músicas', songs: 50, type: 'user', created: '2024-01-15', tracks: [1, 3, 5] },
            { id: 2, name: 'Rock Clássico', songs: 23, type: 'playlist', created: '2023-11-20', tracks: [5] },
            { id: 3, name: 'Dia de Produtividade', songs: 45, type: 'playlist', created: '2024-02-10', tracks: [1, 2, 4] },
            { id: 4, name: 'Noites Relaxantes', songs: 32, type: 'playlist', created: '2024-03-05', tracks: [4, 6] },
        ];
        
        this.artists = [
            { id: 1, name: 'Luna Sky', followers: 1200000, tracks: 34, verified: true },
            { id: 2, name: 'Urban Beats', followers: 850000, tracks: 28, verified: true },
            { id: 3, name: 'Electric Dreams', followers: 2100000, tracks: 56, verified: true },
            { id: 4, name: 'Cosmic Sound', followers: 456000, tracks: 18, verified: false },
        ];
        
        this.albums = [
            { id: 1, title: 'Noites Urbanas', artist: 'Luna Sky', year: 2024, tracks: 12 },
            { id: 2, title: 'Sons Eletrônicos', artist: 'Electric Dreams', year: 2023, tracks: 15 },
        ];
        
        this.loadState();
    }
    
    loadState() {
        try {
            const saved = localStorage.getItem('musicAppState');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.favorites = new Set(parsed.favorites || []);
                this.likedPlaylists = new Set(parsed.likedPlaylists || []);
                this.recentSearches = parsed.recentSearches || [];
                this.recentlyPlayed = parsed.recentlyPlayed || [];
                this.volume = parsed.volume || 70;
            }
        } catch (e) {
            console.warn('⚠️ Erro ao carregar estado:', e);
        }
    }
    
    saveState() {
        try {
            localStorage.setItem('musicAppState', JSON.stringify({
                favorites: Array.from(this.favorites),
                likedPlaylists: Array.from(this.likedPlaylists),
                recentSearches: this.recentSearches.slice(0, 10),
                recentlyPlayed: this.recentlyPlayed.slice(0, 20),
                volume: this.volume
            }));
        } catch (e) {
            console.warn('⚠️ Erro ao salvar estado:', e);
        }
    }
}

const appState = new MusicAppState();

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎵 Inicializando Muse Player - Padrão Spotify');
    initializeApp();
    setupEventListeners();
    setupKeyboardShortcuts();
    createPlayerControls();
    setupContextMenus();
    addStatusBar();
    addPlayerStyles();
    console.log('✅ Muse Player carregado com sucesso!');
});

function initializeApp() {
    navigateTo('home');
    updateRecentlyPlayedSection();
}

// ========================================
// NAVEGAÇÃO
// ========================================

function navigateTo(view) {
    appState.currentView = view;
    
    document.querySelectorAll('nav.main-nav a').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`nav.main-nav a[href="#${view}"]`)?.classList.add('active');
    
    document.querySelectorAll('.results-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const sectionId = view === 'search' ? 'search-content' :
                     view === 'library' ? 'library-content' :
                     'home-content';
    
    document.getElementById(sectionId)?.classList.add('active');
}

function handleNavigation(e) {
    e.preventDefault();
    const href = this.getAttribute('href');
    const view = href.substring(1);
    navigateTo(view);
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
    // Navegação principal
    document.querySelectorAll('nav.main-nav a').forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // Busca com debounce
    const searchInput = document.querySelector('.search-container input');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => handleSearch(e), 300);
        });
        searchInput.addEventListener('focus', showSearchSuggestions);
        searchInput.addEventListener('blur', () => setTimeout(hideSearchSuggestions, 200));
    }
    
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', handleTabSwitch);
    });
    
    // Biblioteca
    const libraryControls = document.querySelectorAll('.library-controls button');
    libraryControls.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            if (index === 0) showCreatePlaylistModal();
            if (index === 1) showLibraryOptions();
        });
    });
    
    // Cards
    document.addEventListener('click', handleCardInteraction);
    
    // Library items
    document.querySelectorAll('.library-item').forEach(item => {
        item.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showContextMenu(e, item, 'library');
        });
    });
}

// ========================================
// ATALHOS DE TECLADO
// ========================================

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
            e.preventDefault();
            togglePlayPause();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.querySelector('.search-container input')?.focus();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft') {
            e.preventDefault();
            playPrevious();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight') {
            e.preventDefault();
            playNext();
        }
    });
}

// ========================================
// MENU DE CONTEXTO
// ========================================

function setupContextMenus() {
    document.addEventListener('contextmenu', (e) => {
        const card = e.target.closest('.result-card');
        if (card && !card.querySelector('.favorite-btn')?.contains(e.target)) {
            e.preventDefault();
            showContextMenu(e, card, 'track');
        }
    });
}

function showContextMenu(e, element, type) {
    e.preventDefault();
    document.getElementById('context-menu')?.remove();
    
    const menu = document.createElement('div');
    menu.id = 'context-menu';
    menu.className = 'context-menu';
    
    let menuHTML = '';
    
    if (type === 'track') {
        const trackId = parseInt(element.getAttribute('data-id'));
        const isFavorite = appState.favorites.has(trackId);
        
        menuHTML = `
            <button class="context-menu-item" data-action="play">▶ Tocar</button>
            <button class="context-menu-item" data-action="add-queue">⏭️ Adicionar à fila</button>
            <div class="context-menu-separator"></div>
            <button class="context-menu-item" data-action="favorite">${isFavorite ? '♥ Remover' : '♡ Curtir'}</button>
            <button class="context-menu-item" data-action="add-playlist">➕ Adicionar à playlist</button>
            <div class="context-menu-separator"></div>
            <button class="context-menu-item" data-action="share">🔗 Compartilhar</button>
            <button class="context-menu-item" data-action="info">ℹ️ Informações</button>
        `;
        
        menu.addEventListener('click', (e) => {
            const action = e.target.getAttribute('data-action');
            const track = appState.tracks.find(t => t.id === trackId);
            
            switch(action) {
                case 'play': playTrack(track); break;
                case 'add-queue': addToQueue(track); break;
                case 'favorite': toggleFavorite(trackId); break;
                case 'add-playlist': showAddToPlaylistModal(track); break;
                case 'share': shareTrack(track); break;
                case 'info': showTrackInfo(track); break;
            }
            menu.remove();
        });
    }
    
    menu.innerHTML = menuHTML;
    document.body.appendChild(menu);
    menu.style.position = 'fixed';
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';
    
    setTimeout(() => {
        document.addEventListener('click', () => menu.remove(), { once: true });
    }, 0);
}

// ========================================
// STATUS BAR
// ========================================

function addStatusBar() {
    const statusBar = document.createElement('div');
    statusBar.id = 'status-bar';
    statusBar.className = 'status-bar';
    statusBar.innerHTML = `<span>🎵 Pronto</span> | <span id="status-queue">Fila: 0</span>`;
    document.body.appendChild(statusBar);
}

// ========================================
// BUSCA
// ========================================

function handleSearch(e) {
    const query = e.target.value.trim();
    appState.searchQuery = query;
    
    if (query.length === 0) {
        clearSearchResults();
        return;
    }
    
    if (query.length > 2) {
        addToRecentSearches(query);
    }
    
    filterAllResults(query);
}

function addToRecentSearches(query) {
    const index = appState.recentSearches.indexOf(query);
    if (index > -1) {
        appState.recentSearches.splice(index, 1);
    }
    appState.recentSearches.unshift(query);
    appState.recentSearches = appState.recentSearches.slice(0, 10);
    appState.saveState();
}

function filterAllResults(query) {
    const lowerQuery = query.toLowerCase();
    
    const artistsTab = document.getElementById('tab-artists');
    if (artistsTab) {
        const filtered = appState.artists.filter(a => 
            a.name.toLowerCase().includes(lowerQuery)
        );
        renderArtistResults(filtered, artistsTab);
    }
    
    const playlistsTab = document.getElementById('tab-playlists');
    if (playlistsTab) {
        const filtered = appState.playlists.filter(p =>
            p.name.toLowerCase().includes(lowerQuery)
        );
        renderPlaylistResults(filtered, playlistsTab);
    }
    
    const tracksTab = document.getElementById('tab-tracks');
    if (tracksTab) {
        const filtered = appState.tracks.filter(t =>
            t.title.toLowerCase().includes(lowerQuery) ||
            t.artist.toLowerCase().includes(lowerQuery)
        );
        renderTrackResults(filtered, tracksTab);
    }
}

function clearSearchResults() {
    document.querySelectorAll('.results-grid').forEach(grid => {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #b3b3b3;">Comece a digitar...</p>';
    });
}

function renderArtistResults(artists, container) {
    const grid = container.querySelector('.results-grid');
    if (!grid) return;
    
    grid.innerHTML = artists.map(a => `
        <article class="result-card" data-type="artist" data-id="${a.id}">
            <div class="result-card-image">🎤</div>
            <h3>${a.name}${a.verified ? ' ✓' : ''}</h3>
            <p>${(a.followers / 1000).toFixed(0)}K seguidores</p>
        </article>
    `).join('');
}

function renderPlaylistResults(playlists, container) {
    const grid = container.querySelector('.results-grid');
    if (!grid) return;
    
    grid.innerHTML = playlists.map(p => `
        <article class="result-card" data-type="playlist" data-id="${p.id}">
            <div class="result-card-image">🎵</div>
            <h3>${p.name}</h3>
            <p>${p.songs} músicas</p>
        </article>
    `).join('');
}

function renderTrackResults(tracks, container) {
    const grid = container.querySelector('.results-grid');
    if (!grid) return;
    
    grid.innerHTML = tracks.map(t => `
        <article class="result-card track-card" data-type="track" data-id="${t.id}">
            <div class="result-card-image">♪</div>
            <h3>${t.title}</h3>
            <p>${t.artist} • ${formatTime(t.duration)}</p>
            <button class="favorite-btn" data-track-id="${t.id}" title="Curtir">♡</button>
        </article>
    `).join('');
    
    grid.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(parseInt(btn.getAttribute('data-track-id')), btn);
        });
    });
}

function handleTabSwitch(e) {
    const parent = e.target.closest('[id^="tab-"]')?.parentElement || e.target.closest('[id^="search"]') || e.target.closest('[id^="library"]');
    if (!parent) return;
    
    parent.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    const tabName = e.target.getAttribute('data-tab');
    parent.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
    const tab = document.getElementById(`tab-${tabName}`);
    if (tab) tab.style.display = 'block';
}

function showSearchSuggestions() {
    if (appState.recentSearches.length === 0) return;
    
    const suggestions = document.createElement('div');
    suggestions.className = 'search-suggestions';
    suggestions.innerHTML = `
        <div style="padding: 12px;">
            <p style="font-size: 12px; color: #b3b3b3; margin-bottom: 8px;">RECENTES</p>
            ${appState.recentSearches.map(s => `
                <div class="suggestion-item">${s}</div>
            `).join('')}
        </div>
    `;
    
    document.querySelector('.search-container')?.appendChild(suggestions);
}

function hideSearchSuggestions() {
    document.querySelector('.search-suggestions')?.remove();
}

// ========================================
// PLAYER
// ========================================

function createPlayerControls() {
    const playerHTML = `
        <div class="player-container">
            <div class="player-info">
                <div class="track-info">
                    <div class="track-image">♪</div>
                    <div>
                        <p class="track-name">Nenhuma música</p>
                        <p class="track-artist">Selecione uma música</p>
                    </div>
                </div>
            </div>
            
            <div class="player-controls">
                <div class="control-buttons">
                    <button class="control-btn shuffle-btn" title="Shuffle">🔀</button>
                    <button class="control-btn prev-btn" title="Anterior">⏮️</button>
                    <button class="control-btn play-btn active" title="Play">▶️</button>
                    <button class="control-btn next-btn" title="Próximo">⏭️</button>
                    <button class="control-btn repeat-btn" title="Repetir">🔁</button>
                </div>
                
                <div class="progress-container">
                    <span class="time-current">0:00</span>
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                        <div class="progress-handle"></div>
                    </div>
                    <span class="time-total">4:00</span>
                </div>
            </div>
            
            <div class="player-volume">
                <button class="volume-btn" title="Volume">🔊</button>
                <div class="volume-slider">
                    <input type="range" min="0" max="100" value="70" class="volume-control">
                </div>
            </div>
        </div>
    `;
    
    const player = document.createElement('div');
    player.innerHTML = playerHTML;
    document.body.appendChild(player);
    
    setupPlayerControls();
}

function setupPlayerControls() {
    document.querySelector('.play-btn').addEventListener('click', togglePlayPause);
    document.querySelector('.next-btn').addEventListener('click', playNext);
    document.querySelector('.prev-btn').addEventListener('click', playPrevious);
    document.querySelector('.shuffle-btn').addEventListener('click', toggleShuffle);
    document.querySelector('.repeat-btn').addEventListener('click', toggleRepeat);
    document.querySelector('.volume-control').addEventListener('input', handleVolumeChange);
    document.querySelector('.volume-btn').addEventListener('click', toggleMute);
    document.querySelector('.progress-bar').addEventListener('click', handleProgressClick);
    document.querySelector('.progress-handle').addEventListener('mousedown', startDraggingProgress);
    
    setInterval(updatePlayerProgress, 1000);
}

function togglePlayPause() {
    if (!appState.currentTrack) {
        playTrack(appState.tracks[0]);
        return;
    }
    
    appState.isPlaying = !appState.isPlaying;
    const playBtn = document.querySelector('.play-btn');
    playBtn.textContent = appState.isPlaying ? '⏸️' : '▶️';
    playBtn.classList.toggle('playing');
    
    showNotification(appState.isPlaying ? '▶ Reproduzindo...' : '⏸ Pausado', 'info');
}

function playTrack(track) {
    appState.currentTrack = track;
    appState.isPlaying = true;
    appState.currentTime = 0;
    appState.duration = track.duration;
    appState.recentlyPlayed.unshift(track.id);
    appState.recentlyPlayed = [...new Set(appState.recentlyPlayed)].slice(0, 20);
    appState.saveState();
    
    document.querySelector('.track-name').textContent = track.title;
    document.querySelector('.track-artist').textContent = track.artist;
    document.querySelector('.play-btn').textContent = '⏸️';
    document.querySelector('.time-total').textContent = formatTime(track.duration);
    
    updateStatusBar();
    showNotification(`▶ ${track.title} - ${track.artist}`, 'success');
}

function playNext() {
    if (appState.queue.length === 0) {
        appState.currentQueueIndex = (appState.currentQueueIndex + 1) % appState.tracks.length;
        playTrack(appState.tracks[appState.currentQueueIndex]);
    } else {
        appState.currentQueueIndex = (appState.currentQueueIndex + 1) % appState.queue.length;
        playTrack(appState.queue[appState.currentQueueIndex]);
    }
}

function playPrevious() {
    if (appState.currentTime > 3) {
        appState.currentTime = 0;
        updateProgressBar();
        return;
    }
    
    if (appState.queue.length === 0) {
        appState.currentQueueIndex = (appState.currentQueueIndex - 1 + appState.tracks.length) % appState.tracks.length;
        playTrack(appState.tracks[appState.currentQueueIndex]);
    } else {
        appState.currentQueueIndex = (appState.currentQueueIndex - 1 + appState.queue.length) % appState.queue.length;
        playTrack(appState.queue[appState.currentQueueIndex]);
    }
}

function toggleShuffle() {
    appState.isShuffle = !appState.isShuffle;
    const btn = document.querySelector('.shuffle-btn');
    btn.classList.toggle('active', appState.isShuffle);
    
    if (appState.isShuffle) {
        appState.originalQueue = [...appState.tracks];
        appState.queue = [...appState.tracks].sort(() => Math.random() - 0.5);
        showNotification('🔀 Shuffle ativado', 'info');
    } else {
        appState.queue = [];
        showNotification('🔀 Shuffle desativado', 'info');
    }
}

let repeatMode = 0;
function toggleRepeat() {
    repeatMode = (repeatMode + 1) % 3;
    const btn = document.querySelector('.repeat-btn');
    btn.classList.toggle('active', repeatMode > 0);
    btn.textContent = ['🔁', '🔂', '🔃'][repeatMode];
    
    const messages = ['Repetição desativada', 'Repetir fila', 'Repetir música'];
    showNotification(messages[repeatMode], 'info');
}

function handleVolumeChange(e) {
    appState.volume = e.target.value;
}

function toggleMute() {
    appState.isMuted = !appState.isMuted;
    const volumeControl = document.querySelector('.volume-control');
    const btn = document.querySelector('.volume-btn');
    
    if (appState.isMuted) {
        appState.volumeBeforeMute = appState.volume;
        volumeControl.disabled = true;
        btn.textContent = '🔇';
        btn.style.opacity = '0.5';
    } else {
        appState.volume = appState.volumeBeforeMute;
        volumeControl.value = appState.volume;
        volumeControl.disabled = false;
        btn.textContent = '🔊';
        btn.style.opacity = '1';
    }
}

function handleProgressClick(e) {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    appState.currentTime = percent * appState.duration;
    updateProgressBar();
}

let isDraggingProgress = false;

function startDraggingProgress(e) {
    isDraggingProgress = true;
    document.addEventListener('mousemove', handleProgressDrag);
    document.addEventListener('mouseup', stopDraggingProgress);
}

function handleProgressDrag(e) {
    if (!isDraggingProgress) return;
    const bar = document.querySelector('.progress-bar');
    const rect = bar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    appState.currentTime = percent * appState.duration;
    updateProgressBar();
}

function stopDraggingProgress() {
    isDraggingProgress = false;
    document.removeEventListener('mousemove', handleProgressDrag);
    document.removeEventListener('mouseup', stopDraggingProgress);
}

function updatePlayerProgress() {
    if (appState.isPlaying && appState.currentTrack) {
        appState.currentTime = Math.min(appState.currentTime + 1, appState.duration);
        updateProgressBar();
        updateStatusBar();
        
        if (appState.currentTime >= appState.duration) {
            if (repeatMode === 2) {
                appState.currentTime = 0;
            } else {
                playNext();
            }
        }
    }
}

function updateProgressBar() {
    const percent = appState.duration > 0 ? (appState.currentTime / appState.duration) * 100 : 0;
    document.querySelector('.progress-fill').style.width = percent + '%';
    document.querySelector('.progress-handle').style.left = percent + '%';
    document.querySelector('.time-current').textContent = formatTime(appState.currentTime);
}

// ========================================
// FAVORITOS E FILA
// ========================================

function toggleFavorite(trackId, element) {
    if (appState.favorites.has(trackId)) {
        appState.favorites.delete(trackId);
        if (element) {
            element.textContent = '♡';
            element.style.color = '';
        }
        showNotification('❤️ Removido dos favoritos', 'info');
    } else {
        appState.favorites.add(trackId);
        if (element) {
            element.textContent = '♥';
            element.style.color = '#1db954';
        }
        showNotification('❤️ Adicionado aos favoritos', 'success');
    }
    appState.saveState();
}

function addToQueue(track) {
    if (appState.queue.length === 0) {
        appState.queue = [...appState.tracks];
    }
    appState.queue.push(track);
    showNotification(`⏭️ Adicionado à fila: ${track.title}`, 'success');
    updateStatusBar();
}

// ========================================
// MODAIS E CONTEXTO
// ========================================

function showCreatePlaylistModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Criar Nova Playlist</h2>
            <input type="text" placeholder="Nome da playlist" class="modal-input">
            <textarea placeholder="Descrição" class="modal-input" rows="3"></textarea>
            <div class="modal-actions">
                <button class="modal-btn cancel">Cancelar</button>
                <button class="modal-btn create">Criar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.cancel').addEventListener('click', () => modal.remove());
    modal.querySelector('.create').addEventListener('click', () => {
        const name = modal.querySelector('input').value;
        if (name.trim()) {
            const newPlaylist = {
                id: Date.now(),
                name: name,
                songs: 0,
                type: 'user',
                created: new Date().toISOString().split('T')[0],
                tracks: []
            };
            appState.playlists.push(newPlaylist);
            showNotification(`✅ Playlist "${name}" criada!`, 'success');
            appState.saveState();
            modal.remove();
        }
    });
}

function showLibraryOptions() {
    showNotification('📚 Clique em uma playlist para gerenciar', 'info');
}

function showAddToPlaylistModal(track) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Adicionar a Playlist</h2>
            <div style="max-height: 300px; overflow-y: auto;">
                ${appState.playlists.map(p => `
                    <div class="playlist-option" data-id="${p.id}">${p.name}</div>
                `).join('')}
            </div>
            <div class="modal-actions">
                <button class="modal-btn cancel">Cancelar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelectorAll('.playlist-option').forEach(opt => {
        opt.addEventListener('click', () => {
            const playlistId = opt.getAttribute('data-id');
            showNotification(`✅ Adicionado à playlist!`, 'success');
            modal.remove();
        });
    });
    
    modal.querySelector('.cancel').addEventListener('click', () => modal.remove());
}

function shareTrack(track) {
    const text = `Ouça "${track.title}" de ${track.artist} no Muse Player 🎵`;
    if (navigator.share) {
        navigator.share({ title: track.title, text: text });
    } else {
        showNotification('🔗 ' + text, 'info');
    }
}

function showTrackInfo(track) {
    const info = `
    <div style="text-align: left;">
        <p><strong>Música:</strong> ${track.title}</p>
        <p><strong>Artista:</strong> ${track.artist}</p>
        <p><strong>Gênero:</strong> ${track.genre}</p>
        <p><strong>Ano:</strong> ${track.year}</p>
        <p><strong>Duração:</strong> ${formatTime(track.duration)}</p>
        <p><strong>Reproduções:</strong> ${track.plays}</p>
    </div>
    `;
    showNotification(info, 'info');
}

function handleCardInteraction(e) {
    const card = e.target.closest('.result-card');
    if (!card || card.querySelector('.favorite-btn')?.contains(e.target)) return;
    
    const type = card.getAttribute('data-type');
    const id = card.getAttribute('data-id');
    
    if (type === 'track') {
        const track = appState.tracks.find(t => t.id == id);
        if (track) playTrack(track);
    } else if (type === 'artist') {
        const artist = appState.artists.find(a => a.id == id);
        showNotification(`🎤 ${artist.name}`, 'info');
    } else if (type === 'playlist') {
        const playlist = appState.playlists.find(p => p.id == id);
        showNotification(`🎵 ${playlist.name}`, 'info');
    }
}

// ========================================
// SEÇÃO RECENTE
// ========================================

function updateRecentlyPlayedSection() {
    const section = document.getElementById('home-content');
    if (!section) return;
    
    const recentTracks = appState.recentlyPlayed
        .map(id => appState.tracks.find(t => t.id === id))
        .filter(t => t)
        .slice(0, 4);
    
    if (recentTracks.length > 0) {
        const grid = section.querySelector('.results-grid');
        if (grid) {
            grid.innerHTML = recentTracks.map(t => `
                <article class="result-card" data-type="track" data-id="${t.id}">
                    <div class="result-card-image">♪</div>
                    <h3>${t.title}</h3>
                    <p>${t.artist}</p>
                </article>
            `).join('');
        }
    }
}

// ========================================
// NOTIFICAÇÕES
// ========================================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ========================================
// UTILITÁRIOS
// ========================================

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function updateStatusBar() {
    const queueSize = appState.queue.length > 0 ? appState.queue.length : appState.tracks.length;
    const status = appState.isPlaying ? '▶' : '⏸';
    const item = document.getElementById('status-queue');
    if (item) item.textContent = `${status} Fila: ${queueSize}`;
}

// ========================================
// ESTILOS
// ========================================

function addPlayerStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .player-container {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 90px;
            background: linear-gradient(90deg, #1db954 0%, #1aa34a 100%);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
            gap: 20px;
            z-index: 999;
            box-shadow: 0 -4px 16px rgba(29, 185, 84, 0.3);
        }
        
        .player-info { flex: 1; min-width: 0; }
        .track-info { display: flex; align-items: center; gap: 12px; cursor: pointer; }
        .track-image { width: 56px; height: 56px; background: rgba(0,0,0,0.2); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
        .track-name { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .track-artist { font-size: 12px; opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        
        .player-controls { flex: 2; display: flex; flex-direction: column; gap: 8px; }
        .control-buttons { display: flex; align-items: center; justify-content: center; gap: 20px; }
        .control-btn { background: transparent; border: none; color: white; cursor: pointer; font-size: 18px; padding: 8px; transition: all 0.2s; }
        .control-btn:hover { transform: scale(1.1); }
        .play-btn { font-size: 24px; background: rgba(0,0,0,0.3); border-radius: 50%; width: 48px; height: 48px; }
        
        .progress-container { display: flex; align-items: center; gap: 8px; }
        .time-current, .time-total { font-size: 12px; font-weight: 600; min-width: 30px; }
        .progress-bar { flex: 1; height: 6px; background: rgba(0,0,0,0.2); border-radius: 3px; position: relative; cursor: pointer; transition: height 0.2s; }
        .progress-bar:hover { height: 8px; }
        .progress-fill { height: 100%; background: white; border-radius: 3px; transition: width 0.1s; }
        .progress-handle { position: absolute; top: 50%; transform: translate(-50%, -50%); width: 12px; height: 12px; background: white; border-radius: 50%; opacity: 0; transition: opacity 0.2s; }
        .progress-bar:hover .progress-handle { opacity: 1; }
        
        .player-volume { flex: 1; max-width: 150px; display: flex; align-items: center; gap: 8px; }
        .volume-btn { background: transparent; border: none; color: white; cursor: pointer; font-size: 18px; }
        .volume-slider { flex: 1; }
        .volume-control { width: 100%; height: 4px; -webkit-appearance: none; appearance: none; background: transparent; cursor: pointer; }
        .volume-control::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; background: white; border-radius: 50%; cursor: pointer; }
        .volume-control::-moz-range-thumb { width: 12px; height: 12px; background: white; border-radius: 50%; border: none; cursor: pointer; }
        
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: #282828;
            border-radius: 8px;
            color: white;
            font-size: 14px;
            z-index: 10000;
            opacity: 0;
            transform: translateY(-20px);
            transition: all 0.3s;
        }
        .notification.show { opacity: 1; transform: translateY(0); }
        .notification-success { background: linear-gradient(135deg, #1db954 0%, #1aa34a 100%); border-left: 3px solid #0f8c3e; }
        .notification-info { background: #1db954; border-left: 3px solid #0f8c3e; }
        
        .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
        }
        .modal-content {
            background: #282828;
            border-radius: 12px;
            padding: 24px;
            max-width: 400px;
            width: 90%;
        }
        .modal-content h2 { margin-bottom: 16px; }
        .modal-input {
            width: 100%;
            padding: 12px;
            margin-bottom: 12px;
            background: #181818;
            border: 1px solid #404040;
            border-radius: 6px;
            color: white;
            font-family: inherit;
        }
        .modal-input:focus { outline: none; border-color: #1db954; box-shadow: 0 0 8px rgba(29,185,84,0.3); }
        .modal-actions { display: flex; gap: 12px; margin-top: 20px; }
        .modal-btn {
            flex: 1;
            padding: 10px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s;
        }
        .modal-btn.cancel { background: #404040; color: white; }
        .modal-btn.cancel:hover { background: #535353; }
        .modal-btn.create { background: #1db954; color: white; }
        .modal-btn.create:hover { background: #1aa34a; }
        
        .context-menu {
            background: #282828;
            border-radius: 8px;
            min-width: 200px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5);
            z-index: 10000;
        }
        .context-menu-item {
            display: block;
            width: 100%;
            padding: 10px 16px;
            background: transparent;
            border: none;
            color: #b3b3b3;
            cursor: pointer;
            text-align: left;
            font-size: 14px;
            transition: all 0.2s;
        }
        .context-menu-item:hover { background: #1db954; color: white; }
        .context-menu-separator { height: 1px; background: #404040; margin: 4px 0; }
        
        .status-bar {
            position: fixed;
            bottom: 91px;
            right: 20px;
            font-size: 12px;
            color: #b3b3b3;
            z-index: 998;
            background: rgba(0,0,0,0.8);
            padding: 4px 8px;
            border-radius: 4px;
        }
        
        .search-suggestions {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: #282828;
            border-radius: 0 0 8px 8px;
            max-height: 300px;
            overflow-y: auto;
            z-index: 1000;
        }
        .suggestion-item {
            padding: 12px 16px;
            cursor: pointer;
            transition: all 0.2s;
            color: #b3b3b3;
        }
        .suggestion-item:hover { background: #333333; color: #1db954; }
        
        .favorite-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            background: rgba(0,0,0,0.4);
            border: none;
            color: white;
            cursor: pointer;
            font-size: 16px;
            padding: 6px 8px;
            border-radius: 4px;
            opacity: 0;
            transition: all 0.2s;
        }
        .track-card:hover .favorite-btn { opacity: 1; }
        .favorite-btn:hover { background: rgba(0,0,0,0.7); color: #1db954; }
        
        @media (max-width: 1024px) {
            .player-container { height: 70px; }
            .player-info { display: none; }
            .control-btn { font-size: 16px; }
            .play-btn { width: 40px; height: 40px; font-size: 18px; }
        }
    `;
    
    document.head.appendChild(style);
}

console.log('✅ Script Spotify-like carregado!');
