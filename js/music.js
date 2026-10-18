/* =========================================================
   全局留声机 (js/music.js)
   跨空间歌单跟随 / 同曲无缝续播 / 首次点击唤醒
   ========================================================= */

let hallPlaylist = [];
let hallTrackIndex = 0;   // （原样保留，暂未使用）
let activePlaylist = [];
let activeTrackIndex = 0;
let currentPlayingSrc = "";

function initMasterMusicSystem() {
    hallPlaylist = [];
    WORKS_DATA.projects.forEach(proj => {
        if (proj.bgm && proj.bgm.length > 0) {
            proj.bgm.forEach(track => {
                hallPlaylist.push({ title: track.title || proj.titleMain, src: track.src });
            });
        }
    });

    for (let i = hallPlaylist.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [hallPlaylist[i], hallPlaylist[j]] = [hallPlaylist[j], hallPlaylist[i]];
    }

    const audio = document.getElementById('masterAudio');
    if (!audio || hallPlaylist.length === 0) return;

    activePlaylist = hallPlaylist;
    activeTrackIndex = 0;

    loadAndPlayTrack(activePlaylist[0], true);

    audio.addEventListener('ended', () => {
        if (activePlaylist.length > 1) nextGlobalMusic();
    });

    const wakeUpAudio = () => {
        if (audio.paused && activePlaylist.length > 0) {
            audio.play().then(() => { updateMusicUI(true, activePlaylist[activeTrackIndex].title); }).catch(() => {});
        }
        document.removeEventListener('click', wakeUpAudio);
    };
    document.addEventListener('click', wakeUpAudio, { once: true });
}

function loadAndPlayTrack(trackObj, isInitial = false) {
    const audio = document.getElementById('masterAudio');
    const nextBtn = document.getElementById('globalNextBtn');
    if (!audio || !trackObj) return;

    if (nextBtn) nextBtn.style.display = activePlaylist.length > 1 ? 'inline-flex' : 'none';

    const targetNorm = normalizeSrc(trackObj.src);

    if (currentPlayingSrc === targetNorm && !isInitial) {
        audio.loop = (activePlaylist.length === 1);
        if (audio.paused) {
            audio.play().then(() => updateMusicUI(true, trackObj.title)).catch(() => {});
        } else {
            updateMusicUI(true, trackObj.title);
        }
        return;
    }

    currentPlayingSrc = targetNorm;
    audio.src = trackObj.src;
    audio.loop = (activePlaylist.length === 1);

    audio.play().then(() => {
        updateMusicUI(true, trackObj.title);
    }).catch(() => {
        updateMusicUI(false, trackObj.title, true);
    });
}

function switchMusicContext(targetPlaylist) {
    if (!targetPlaylist || targetPlaylist.length === 0) return;

    activePlaylist = targetPlaylist;
    const nextBtn = document.getElementById('globalNextBtn');
    if (nextBtn) nextBtn.style.display = activePlaylist.length > 1 ? 'inline-flex' : 'none';

    const audio = document.getElementById('masterAudio');
    const matchIdx = activePlaylist.findIndex(t => normalizeSrc(t.src) === currentPlayingSrc);

    if (matchIdx !== -1) {
        activeTrackIndex = matchIdx;
        audio.loop = (activePlaylist.length === 1);
        if (audio.paused) {
            audio.play().then(() => updateMusicUI(true, activePlaylist[activeTrackIndex].title)).catch(() => {});
        } else {
            updateMusicUI(true, activePlaylist[activeTrackIndex].title);
        }
    } else {
        activeTrackIndex = 0;
        loadAndPlayTrack(activePlaylist[0]);
    }
}

function updateMusicUI(isPlaying, titleText, isWaitingWake = false) {
    const wave = document.getElementById('globalWave');
    if (!wave) return;
    if (isPlaying) {
        wave.classList.add('playing');
        setText('globalTrackName', `正在听：${titleText}`);
    } else {
        wave.classList.remove('playing');
        setText('globalTrackName', isWaitingWake ? `♪ 轻触开启配乐：${titleText}` : `♪ 已暂停：${titleText}`);
    }
}

function toggleGlobalMusic() {
    const audio = document.getElementById('masterAudio');
    if (!audio || activePlaylist.length === 0) return;
    const curTitle = activePlaylist[activeTrackIndex].title;

    if (audio.paused) {
        audio.play().then(() => updateMusicUI(true, curTitle)).catch(() => {});
    } else {
        audio.pause();
        updateMusicUI(false, curTitle);
    }
}

function nextGlobalMusic() {
    if (activePlaylist.length <= 1) return;
    activeTrackIndex = (activeTrackIndex + 1) % activePlaylist.length;
    loadAndPlayTrack(activePlaylist[activeTrackIndex]);
}