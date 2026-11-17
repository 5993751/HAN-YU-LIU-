/* =========================================================
   全局留声机 (js/music.js)
   跨空间歌单跟随 / 同曲无缝续播 / 首次点击唤醒
   ========================================================= */

let hallPlaylist = [];
let activePlaylist = [];
let activeTrackIndex = 0;
let currentPlayingSrc = "";

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

    loadAndPlayTrack(activePlaylist[0], true);

    audio.addEventListener('ended', () => {
        if (activePlaylist.length > 1) nextGlobalMusic();
    });

    const wakeUpAudio = () => {
        if (audio.paused && activePlaylist.length > 0) {
            if (typeof primeAudioContext === 'function') primeAudioContext();
            playAudio(activePlaylist[activeTrackIndex]);
        }
        document.removeEventListener('click', wakeUpAudio);
    };
    document.addEventListener('click', wakeUpAudio, { once: true });
}

/* 统一的播放动作：成功刷新 UI；被浏览器拦截时按需提示“轻触开启配乐” */
function playAudio(trackObj, reportBlocked = false) {
    const audio = document.getElementById('masterAudio');
    if (!audio || !trackObj) return;

    audio.play().then(() => {
        updateMusicUI(true, trackObj.title);
    }).catch(() => {
        if (reportBlocked) updateMusicUI(false, trackObj.title, true);
    });
}

/* “下一首”按钮只在歌单多于一首时出现 */
function syncNextButtonVisibility() {
    const nextBtn = document.getElementById('globalNextBtn');
    if (nextBtn) nextBtn.style.display = activePlaylist.length > 1 ? 'inline-flex' : 'none';
}

/* 某首歌在当前歌单里的位置；找不到时保留原位置 */
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
        if (audio.paused) {
            playAudio(trackObj);
        } else {
            updateMusicUI(true, trackObj.title);
        }
        return;
    }

    currentPlayingSrc = targetNorm;
    audio.src = trackObj.src;
    audio.loop = (activePlaylist.length === 1);

    playAudio(trackObj, true);
}

function switchMusicContext(targetPlaylist) {
    if (!targetPlaylist || targetPlaylist.length === 0) return;

    activePlaylist = targetPlaylist;
    syncNextButtonVisibility();

    const audio = document.getElementById('masterAudio');
    const matchIdx = activePlaylist.findIndex(t => normalizeSrc(t.src) === currentPlayingSrc);

    if (matchIdx !== -1) {
        activeTrackIndex = matchIdx;
        audio.loop = (activePlaylist.length === 1);
        if (audio.paused) {
            playAudio(activePlaylist[activeTrackIndex]);
        } else {
            updateMusicUI(true, activePlaylist[activeTrackIndex].title);
        }
    } else {
        activeTrackIndex = 0;
        loadAndPlayTrack(activePlaylist[0]);
    }
}

/* 手机上歌名只留三个字：顶栏窄，长名字会挡住返回与标题 */
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
        setText('globalMusicState', '正在听：');
        setText('globalTrackName', trackName);
        startAudioViz();
    } else {
        wave.classList.remove('playing');
        // 唤醒提示本身已经够长，手机上不再接歌名，否则又会把顶栏撑满
        const compactWake = isWaitingWake && window.innerWidth <= 900;
        setText('globalMusicState', isWaitingWake ? (compactWake ? '♪ 轻触开启配乐' : '♪ 轻触开启配乐：') : '♪ 已暂停：');
        setText('globalTrackName', compactWake ? '' : trackName);
        stopAudioViz();
    }
}

function toggleGlobalMusic() {
    const audio = document.getElementById('masterAudio');
    if (!audio || activePlaylist.length === 0) return;
    const currentTrack = activePlaylist[activeTrackIndex];

    if (audio.paused) {
        if (typeof primeAudioContext === 'function') primeAudioContext();
        playAudio(currentTrack);
    } else {
        audio.pause();
        updateMusicUI(false, currentTrack.title);
    }
}

function nextGlobalMusic() {
    if (activePlaylist.length <= 1) return;
    activeTrackIndex = (activeTrackIndex + 1) % activePlaylist.length;
    loadAndPlayTrack(activePlaylist[activeTrackIndex]);
}