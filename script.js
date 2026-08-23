// Список ваших треков (замените на свои файлы)
const tracks = [
    {
        name: "BASSLINE BUSINESS",
        file: "01 BASSLINE BUSINESS.mp3"
    }
];

let currentTrack = 0;
const audio = document.getElementById('audio');
const playlist = document.getElementById('playlist');
const trackName = document.getElementById('trackName');
const progress = document.getElementById('progress');

// Загрузка плейлиста
function loadPlaylist() {
    tracks.forEach((track, index) => {
        const li = document.createElement('li');
        li.textContent = track.name;
        li.onclick = () => playTrack(index);
        playlist.appendChild(li);
    });
}

// Воспроизведение трека
function playTrack(index) {
    currentTrack = index;
    audio.src = tracks[index].file;
    audio.play();
    trackName.textContent = tracks[index].name;
    updatePlaylistUI();
}

// Управление
function playPause() {
    if (audio.paused) {
        audio.play();
    } else {
        audio.pause();
    }
}

function nextTrack() {
    currentTrack = (currentTrack + 1) % tracks.length;
    playTrack(currentTrack);
}

function prevTrack() {
    currentTrack = (currentTrack - 1 + tracks.length) % tracks.length;
    playTrack(currentTrack);
}

// Обновление прогресс-бара
audio.ontimeupdate = () => {
    progress.value = (audio.currentTime / audio.duration) * 100;
};

progress.onchange = () => {
    audio.currentTime = (progress.value / 100) * audio.duration;
};

// Обновление UI плейлиста
function updatePlaylistUI() {
    const items = playlist.children;
    for (let i = 0; i < items.length; i++) {
        items[i].classList.toggle('active', i === currentTrack);
    }
}

// Инициализация
loadPlaylist();
playTrack(0);
