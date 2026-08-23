const SUPABASE_URL = 'https://jsiloywkoyurrkbpehos.supabase.co';
const SUPABASE_KEY = 'sb_publishable_y1jqiS8uXKxf0XhLkaQ7Jw_qUa8Ol9V';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentQueue = [];
let currentIndex = 0;
let isShuffle = false;
let currentArtistId = null;
let currentAlbumId = null;

const audio = document.getElementById('audio');
const progress = document.getElementById('progress');
const volume = document.getElementById('volume');
const playPauseBtn = document.getElementById('playPauseBtn');

function showPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
    document.getElementById(`page-${pageName}`).classList.add('active');
    document.getElementById(`nav-${pageName}`).classList.add('active');
    
    if (pageName === 'home') loadQueue();
    if (pageName === 'search') {
        document.getElementById('searchInput').value = '';
        document.getElementById('searchResultsContainer').innerHTML = '<p style="color: #b3b3b3; text-align: center; margin-top: 40px;">Введите запрос для поиска</p>';
        document.getElementById('searchInput').focus();
    }
    if (pageName === 'albums') loadAlbums();
}

async function loadQueue() {
    const { data: tracks } = await supabase
        .from('tracks')
        .select('*, artists(name), albums(title, cover)')
        .order('created_at');
    
    if (tracks) {
        currentQueue = tracks;
        renderQueue();
    }
}

function renderQueue() {
    const queueList = document.getElementById('queueList');
    queueList.innerHTML = '';
    
    currentQueue.forEach((track, index) => {
        const li = createTrackItem(track, index);
        queueList.appendChild(li);
    });
}

function createTrackItem(track, index) {
    const li = document.createElement('li');
    li.className = 'track-item';
    li.onclick = () => playTrack(index);
    
    li.innerHTML = `
        <span class="track-number">${index + 1}</span>
        <div class="track-info">
            <div class="track-title">${track.title}</div>
            <div class="track-artist" onclick="event.stopPropagation(); showArtist('${track.artist_id}')">
                ${track.artists?.name || 'Неизвестный'}
            </div>
        </div>
    `;
    
    return li;
}

function playTrack(index) {
    currentIndex = index;
    const track = currentQueue[index];
    audio.src = track.url;
    audio.play();
    playPauseBtn.textContent = '⏸️';
    
    document.getElementById('currentTrackTitle').textContent = track.title;
    document.getElementById('currentTrackArtist').textContent = track.artists?.name || '';
    
    if (track.albums?.cover) {
        document.getElementById('currentCover').src = track.albums.cover;
    }
    
    updateActiveTrack();
}

function playPause() {
    if (audio.paused) {
        audio.play();
        playPauseBtn.textContent = '⏸️';
    } else {
        audio.pause();
        playPauseBtn.textContent = '▶️';
    }
}

function nextTrack() {
    if (currentQueue.length === 0) return;
    currentIndex = (currentIndex + 1) % currentQueue.length;
    playTrack(currentIndex);
}

function prevTrack() {
    if (currentQueue.length === 0) return;
    currentIndex = (currentIndex - 1 + currentQueue.length) % currentQueue.length;
    playTrack(currentIndex);
}

function toggleShuffle() {
    isShuffle = !isShuffle;
    document.getElementById('shuffleBtn').style.color = isShuffle ? '#1DB954' : '#ffffff';
}

function updateActiveTrack() {
    document.querySelectorAll('.track-item').forEach((item, index) => {
        item.classList.toggle('active', index === currentIndex);
    });
}

async function searchTracks() {
    const query = document.getElementById('searchInput').value.trim();
    const container = document.getElementById('searchResultsContainer');
    
    if (!query) {
        container.innerHTML = '<p style="color: #b3b3b3; text-align: center; margin-top: 40px;">Введите запрос для поиска</p>';
        return;
    }
    
    container.innerHTML = '<p style="color: #b3b3b3; text-align: center; margin-top: 40px;">Поиск...</p>';
    
    const { data: tracks } = await supabase
        .from('tracks')
        .select('*, artists(name)')
        .ilike('title', `%${query}%`)
        .limit(20);
    
    const { data: tracksByArtist } = await supabase
        .from('tracks')
        .select('*, artists(name)')
        .ilike('artists.name', `%${query}%`)
        .limit(20);
    
    container.innerHTML = '<ul id="searchResults" class="track-list"></ul>';
    const results = document.getElementById('searchResults');
    
    if ((!tracks || tracks.length === 0) && (!tracksByArtist || tracksByArtist.length === 0)) {
        results.innerHTML = '<p style="color: #b3b3b3; text-align: center;">Ничего не найдено</p>';
        return;
    }
    
    const allResults = [...(tracks || []), ...(tracksByArtist || [])];
    const uniqueResults = Array.from(new Map(allResults.map(track => [track.id, track])).values());
    
    uniqueResults.forEach(track => {
        const li = document.createElement('li');
        li.className = 'track-item';
        li.onclick = () => {
            currentQueue = [track];
            playTrack(0);
            showPage('home');
        };
        
        li.innerHTML = `
            <div class="track-info">
                <div class="track-title">${track.title}</div>
                <div class="track-artist" onclick="event.stopPropagation(); showArtist('${track.artist_id}')">
                    ${track.artists?.name || 'Неизвестный'}
                </div>
            </div>
            <span style="color: #1DB954; font-size: 20px;">▶️</span>
        `;
        
        results.appendChild(li);
    });
}

async function loadAlbums() {
    const { data: albums } = await supabase
        .from('albums')
        .select('*, artists(name)');
    
    const grid = document.getElementById('albumsGrid');
    grid.innerHTML = '';
    
    if (albums) {
        albums.forEach(album => {
            const card = document.createElement('div');
            card.className = 'album-card';
            
            card.innerHTML = `
                <img src="${album.cover || ''}" class="album-cover-img" onerror="this.style.background='#333'">
                <div class="album-card-title" onclick="showAlbum('${album.id}')">${album.title}</div>
                <div class="album-card-artist" onclick="showArtist('${album.artist_id}')">${album.artists?.name || ''}</div>
                <button class="album-play-btn" onclick="event.stopPropagation(); playAlbum('${album.id}')">▶️</button>
            `;
            
            grid.appendChild(card);
        });
    }
}

async function showArtist(artistId) {
    currentArtistId = artistId;
    showPage('artist');
    
    const { data: artist } = await supabase
        .from('artists')
        .select('*')
        .eq('id', artistId)
        .single();
    
    if (artist) {
        document.getElementById('artistName').textContent = artist.name;
        document.getElementById('artistPhoto').src = artist.photo || '';
        
        const { data: tracks } = await supabase
            .from('tracks')
            .select('*, artists(name)')
            .eq('artist_id', artistId);
        
        if (tracks) {
            currentQueue = tracks;
            const trackList = document.getElementById('artistTracks');
            trackList.innerHTML = '';
            tracks.forEach((track, index) => {
                trackList.appendChild(createTrackItem(track, index));
            });
        }
        
        const { data: albums } = await supabase
            .from('albums')
            .select('*')
            .eq('artist_id', artistId);
        
        const albumGrid = document.getElementById('artistAlbums');
        albumGrid.innerHTML = '';
        if (albums) {
            albums.forEach(album => {
                const card = document.createElement('div');
                card.className = 'album-card';
                card.innerHTML = `
                    <img src="${album.cover || ''}" class="album-cover-img">
                    <div class="album-card-title" onclick="showAlbum('${album.id}')">${album.title}</div>
                    <div class="album-card-artist">${album.year || ''}</div>
                    <button class="album-play-btn" onclick="playAlbum('${album.id}')">▶️</button>
                `;
                albumGrid.appendChild(card);
            });
        }
    }
}

async function showAlbum(albumId) {
    currentAlbumId = albumId;
    showPage('album');
    
    const { data: album } = await supabase
        .from('albums')
        .select('*, artists(name)')
        .eq('id', albumId)
        .single();
    
    if (album) {
        document.getElementById('albumTitle').textContent = album.title;
        document.getElementById('albumArtist').textContent = album.artists?.name || '';
        document.getElementById('albumYear').textContent = album.year || '';
        document.getElementById('albumCover').src = album.cover || '';
        
        const { data: tracks } = await supabase
            .from('tracks')
            .select('*, artists(name)')
            .eq('album_id', albumId)
            .order('track_number');
        
        if (tracks) {
            currentQueue = tracks;
            const trackList = document.getElementById('albumTracks');
            trackList.innerHTML = '';
            tracks.forEach((track, index) => {
                trackList.appendChild(createTrackItem(track, index));
            });
        }
    }
}

async function playAlbum(albumId) {
    const { data: tracks } = await supabase
        .from('tracks')
        .select('*, artists(name)')
        .eq('album_id', albumId)
        .order('track_number');
    
    if (tracks && tracks.length > 0) {
        currentQueue = tracks;
        playTrack(0);
    }
}

async function playAllArtistTracks() {
    if (currentArtistId) {
        const { data: tracks } = await supabase
            .from('tracks')
            .select('*, artists(name)')
            .eq('artist_id', currentArtistId);
        
        if (tracks && tracks.length > 0) {
            currentQueue = tracks;
            playTrack(0);
        }
    }
}

async function playAllAlbumTracks() {
    if (currentAlbumId) {
        const { data: tracks } = await supabase
            .from('tracks')
            .select('*, artists(name)')
            .eq('album_id', currentAlbumId)
            .order('track_number');
        
        if (tracks && tracks.length > 0) {
            currentQueue = tracks;
            playTrack(0);
        }
    }
}

audio.ontimeupdate = () => {
    if (audio.duration) {
        progress.value = (audio.currentTime / audio.duration) * 100;
        document.getElementById('currentTime').textContent = formatTime(audio.currentTime);
        document.getElementById('totalTime').textContent = formatTime(audio.duration);
    }
};

progress.onchange = () => {
    audio.currentTime = (progress.value / 100) * audio.duration;
};

volume.oninput = () => {
    audio.volume = volume.value;
};

audio.onended = () => {
    if (isShuffle && currentQueue.length > 1) {
        currentIndex = Math.floor(Math.random() * currentQueue.length);
    } else {
        nextTrack();
    }
    playTrack(currentIndex);
};

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

loadQueue();
