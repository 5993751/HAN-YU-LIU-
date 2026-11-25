/* 全局留声机：跨空间歌单跟随、同曲续播与播放状态维护 */

let hallPlaylist = [];
let activePlaylist = [];
let activeTrackIndex = 0;
let currentPlayingSrc = "";
let musicPausedByUser = false;

function getMusicText(key, fallback) {
    return (typeof SITE_TEXT !== 'undefined' && SITE_TEXT.music && SITE_TEXT.music[key]) || fallback;
}

function initMasterMusicSystem() {
    hallPlaylist = [];
    WORKS_DATA.projects.forEach(proj => {
        if (proj.bgm && proj.bgm.length > 0) {
            proj.bgm.forEach(track => {
                hallPlaylist.push({ title: track.title || getWorkCopy(proj).title, src: track.src });
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
    syncNextButtonVisibility();

    // 延后到开场幕布首屏资源就绪后再挂载音频源，避免弱网下数 MB 音频抢占首屏画作与字体带宽
    const startInitialAudio = () => {
        if (musicPausedByUser || currentPlayingSrc || activePlaylist.length === 0) return;
        loadAndPlayTrack(activePlaylist[activeTrackIndex], true);
    };

    if (!isCurtainBlocking()) {
        startInitialAudio();
    } else {
        updateMusicUI(false, activePlaylist[0].title, true);
        document.addEventListener('curtain:ready', startInitialAudio, { once: true });
    }

    audio.addEventListener('ended', () => {
        if (activePlaylist.length > 1) nextGlobalMusic();
    });

    const wakeUpAudio = (e) => {
        if (e.target && e.target.closest && e.target.closest('#musicDock')) return;
        if (!musicPausedByUser && audio.paused && activePlaylist.length > 0) {
            if (typeof primeAudioContext === 'function') primeAudioContext();
            if (!currentPlayingSrc) {
                loadAndPlayTrack(activePlaylist[activeTrackIndex]);
            } else {
                playAudio(activePlaylist[activeTrackIndex]);
            }
        }
    };
    document.addEventListener('click', wakeUpAudio, { once: true });
}

function playAudio(trackObj, reportBlocked = false) {
    const audio = document.getElementById('masterAudio');
    if (!audio || !trackObj) return;

    audio.play().then(() => {
        updateMusicUI(true, trackObj.title);
    }).catch(() => {
        if (reportBlocked) updateMusicUI(false, trackObj.title, true);
    });
}

function syncNextButtonVisibility() {
    const nextBtn = document.getElementById('globalNextBtn');
    if (nextBtn) nextBtn.style.display = activePlaylist.length > 1 ? 'inline-flex' : 'none';
}

function findPlaylistIndex(src, fallback) {
    const target = normalizeSrc(src);
    const idx = activePlaylist.findIndex(t => normalizeSrc(t.src) === target);
    return idx === -1 ? fallback : idx;
}

function loadAndPlayTrack(trackObj, isInitial = false) {
    const audio = document.getElementById('masterAudio');
    if (!audio || !trackObj) return;

    syncNextButtonVisibility();

    const targetNorm = normalizeSrc(trackObj.src);

    if (currentPlayingSrc === targetNorm && !isInitial) {
        audio.loop = (activePlaylist.length === 1);
        if (musicPausedByUser) {
            updateMusicUI(false, trackObj.title);
        } else if (audio.paused) {
            playAudio(trackObj);
        } else {
            updateMusicUI(true, trackObj.title);
        }
        return;
    }

    currentPlayingSrc = targetNorm;
    audio.src = trackObj.src;
    audio.loop = (activePlaylist.length === 1);

    if (musicPausedByUser) {
        updateMusicUI(false, trackObj.title);
        return;
    }

    playAudio(trackObj, true);
}

function switchMusicContext(targetPlaylist, preferredSrc = null) {
    if (!targetPlaylist || targetPlaylist.length === 0) return;

    activePlaylist = targetPlaylist;
    syncNextButtonVisibility();

    const audio = document.getElementById('masterAudio');
    if (!audio) return;

    if (preferredSrc) {
        const prefIdx = findPlaylistIndex(preferredSrc, -1);
        if (prefIdx !== -1) {
            activeTrackIndex = prefIdx;
            loadAndPlayTrack(activePlaylist[prefIdx]);
            return;
        }
    }

    const matchIdx = activePlaylist.findIndex(t => normalizeSrc(t.src) === currentPlayingSrc);

    if (matchIdx !== -1) {
        activeTrackIndex = matchIdx;
        audio.loop = (activePlaylist.length === 1);
        if (musicPausedByUser) {
            updateMusicUI(false, activePlaylist[activeTrackIndex].title);
        } else if (audio.paused) {
            playAudio(activePlaylist[activeTrackIndex]);
        } else {
            updateMusicUI(true, activePlaylist[activeTrackIndex].title);
        }
    } else {
        activeTrackIndex = 0;
        loadAndPlayTrack(activePlaylist[0]);
    }
}

function shortTrackName(titleText) {
    const name = titleText || '';
    if (window.innerWidth > 900 || name.length <= 3) return name;
    return name.slice(0, 3) + '…';
}

function updateMusicUI(isPlaying, titleText, isWaitingWake = false) {
    const wave = document.getElementById('globalWave');
    if (!wave) return;
    const trackName = shortTrackName(titleText);
    if (isPlaying) {
        wave.classList.add('playing');
        setText('globalMusicState', getMusicText('playingState', '正在听：'));
        setText('globalTrackName', trackName);
        startAudioViz();
    } else {
        wave.classList.remove('playing');
        const compactWake = isWaitingWake && window.innerWidth <= 900;
        const label = isWaitingWake
            ? (compactWake
                ? getMusicText('waitingStateCompact', '♪ 轻触开启配乐')
                : getMusicText('waitingState', '♪ 轻触开启配乐：'))
            : getMusicText('pausedState', '♪ 已暂停：');
        setText('globalMusicState', label);
        setText('globalTrackName', compactWake ? '' : trackName);
        stopAudioViz();
    }
}

function toggleGlobalMusic() {
    const audio = document.getElementById('masterAudio');
    if (!audio || activePlaylist.length === 0) return;
    const currentTrack = activePlaylist[activeTrackIndex];

    if (audio.paused) {
        musicPausedByUser = false;
        if (typeof primeAudioContext === 'function') primeAudioContext();
        if (!currentPlayingSrc) loadAndPlayTrack(currentTrack);
        else playAudio(currentTrack);
    } else {
        musicPausedByUser = true;
        audio.pause();
        updateMusicUI(false, currentTrack.title);
    }
}

function nextGlobalMusic() {
    if (activePlaylist.length <= 1) return;
    activeTrackIndex = (activeTrackIndex + 1) % activePlaylist.length;
    loadAndPlayTrack(activePlaylist[activeTrackIndex]);
}
