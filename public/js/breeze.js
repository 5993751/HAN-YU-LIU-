/* 首页微风动态背景：双视频接力循环、文件探测与离屏暂停 */

let breezeTimer = null;
let breezeIndex = 0;
let activeBreezeSlot = 'A';
let breezePauseTimer = null;

function setSlotMedia(slotEl, url) {
    if (!slotEl) return;
    const isVideo = /\.(mp4|webm)$/i.test(url);
    const slowRate = SITE_SETTINGS.breezeSlowFactor || 1;

    slotEl.dataset.releaseToken = '';

    if (isVideo) {
        slotEl.innerHTML = `
            <video src="${url}" muted playsinline preload="auto" class="breeze-clone clone-1 loop-video active"></video>
            <video src="${url}" muted playsinline preload="none" class="breeze-clone clone-1 loop-video"></video>`;
        setupRelayLoop(slotEl, slowRate);
    } else {
        const clones = slotEl.querySelectorAll('.breeze-clone');
        clones.forEach(c => {
            c.style.backgroundImage = `url('${url}')`;
        });
    }
}

function setupRelayLoop(slotEl, rate) {
    const vids = slotEl.querySelectorAll('video.loop-video');
    if (vids.length < 2) return;
    let activeVid = vids[0];
    let standbyVid = vids[1];

    activeVid.playbackRate = rate;
    standbyVid.playbackRate = rate;

    const fallbackSingleLoop = (vid) => {
        vid.loop = true;
        vid.classList.add('active');
        if (!document.body.classList.contains('mode-gallery')) {
            vid.play().catch(() => {});
        }
    };

    const armStandby = () => {
        if (standbyVid.preload === 'none') {
            standbyVid.preload = 'auto';
            standbyVid.load();
        }
    };
    if (activeVid.readyState >= 3) armStandby();
    else activeVid.addEventListener('canplaythrough', armStandby, { once: true });

    const onTimeUpdate = (e) => {
        const vid = e.target;
        if (vid.duration > 0 && (vid.duration - vid.currentTime) <= 0.15) {
            if (document.body.classList.contains('mode-gallery')) return;
            vid.removeEventListener('timeupdate', onTimeUpdate);
            armStandby();
            standbyVid.currentTime = 0;

            standbyVid.play().then(() => {
                standbyVid.classList.add('active');
                vid.classList.remove('active');

                const temp = activeVid;
                activeVid = standbyVid;
                standbyVid = temp;

                activeVid.addEventListener('timeupdate', onTimeUpdate);
            }).catch(() => {
                fallbackSingleLoop(vid);
            });
        }
    };

    const onEnded = (e) => {
        const vid = e.target;
        if (vid !== activeVid || vid.loop) return;
        vid.removeEventListener('timeupdate', onTimeUpdate);
        fallbackSingleLoop(vid);
    };

    vids[0].addEventListener('ended', onEnded);
    vids[1].addEventListener('ended', onEnded);
    activeVid.addEventListener('timeupdate', onTimeUpdate);
    if (!document.body.classList.contains('mode-gallery')) {
        activeVid.play().catch(() => {
            fallbackSingleLoop(activeVid);
        });
    }
}

function switchBreezeSlot(url) {
    const slotA = document.getElementById('breezeSlotA');
    const slotB = document.getElementById('breezeSlotB');
    if (!slotA || !slotB) return;

    const fromSlot = activeBreezeSlot === 'A' ? slotA : slotB;
    const nextSlot = activeBreezeSlot === 'A' ? slotB : slotA;

    setSlotMedia(nextSlot, url);

    let revealed = false;
    const reveal = () => {
        if (revealed) return;
        revealed = true;

        nextSlot.classList.add('active');
        fromSlot.classList.remove('active');
        activeBreezeSlot = nextSlot === slotA ? 'A' : 'B';

        releaseSlotLater(fromSlot);
    };

    const video = nextSlot.querySelector('video.loop-video');
    if (!video) {
        reveal();
        return;
    }

    if (video.readyState >= 3) {
        reveal();
    } else {
        video.addEventListener('canplay', reveal, { once: true });
        setTimeout(reveal, 8000);
    }
}

function releaseSlotLater(slotEl) {
    if (!slotEl) return;
    const token = String(Date.now() + Math.random());
    slotEl.dataset.releaseToken = token;

    setTimeout(() => {
        if (slotEl.dataset.releaseToken !== token) return;
        if (slotEl.classList.contains('active')) return;

        slotEl.querySelectorAll('video').forEach(v => {
            v.pause();
            v.removeAttribute('src');
            v.load();
        });
        slotEl.innerHTML = '';
    }, 6500);
}

function announceBreezeReady() {
    if (document.documentElement.dataset.breezeReady === '1') return;
    document.documentElement.dataset.breezeReady = '1';
    document.dispatchEvent(new CustomEvent('breeze:first-ready'));
}

function initBreezeBackground() {
    const list = SITE_SETTINGS.breezeBackgrounds || [];
    if (list.length === 0) {
        announceBreezeReady();
        return;
    }

    const slotA = document.getElementById('breezeSlotA');
    const slotB = document.getElementById('breezeSlotB');
    if (!slotA || !slotB) return;

    if (breezeTimer) {
        clearInterval(breezeTimer);
        breezeTimer = null;
    }

    breezeIndex = Math.floor(Math.random() * list.length);
    activeBreezeSlot = 'A';
    setSlotMedia(slotA, list[breezeIndex]);
    slotA.classList.add('active');
    slotB.classList.remove('active');

    const scheduleDiscovery = () => {
        discoverBreezeBackgrounds().then(updated => {
            if (updated && updated.length > 1) startBreezeTimer();
        });
    };

    const firstVideo = slotA.querySelector('video.loop-video');
    if (firstVideo) {
        if (firstVideo.readyState >= 2) {
            announceBreezeReady();
            scheduleDiscovery();
        } else {
            const onFirstReady = () => {
                announceBreezeReady();
                scheduleDiscovery();
            };
            firstVideo.addEventListener('canplay', onFirstReady, { once: true });
            setTimeout(onFirstReady, 6000);
        }
    } else {
        announceBreezeReady();
        scheduleDiscovery();
    }

    startBreezeTimer();
}

function startBreezeTimer() {
    const list = SITE_SETTINGS.breezeBackgrounds || [];

    if (breezeTimer) {
        clearInterval(breezeTimer);
        breezeTimer = null;
    }
    if (list.length <= 1) return;

    const intervalMs = (SITE_SETTINGS.breezeSwitchMinutes || 5) * 60 * 1000;
    breezeTimer = setInterval(() => {
        breezeIndex = (breezeIndex + 1) % list.length;
        switchBreezeSlot(list[breezeIndex]);
    }, intervalMs);
}

async function discoverBreezeBackgrounds() {
    const list = SITE_SETTINGS.breezeBackgrounds || [];
    if (location.protocol === 'file:') return list;
    if (navigator.connection && navigator.connection.saveData) return list;

    const prefix = SITE_SETTINGS.breezeFilePrefix;
    const ext = SITE_SETTINGS.breezeFileExt;
    const max = SITE_SETTINGS.breezeMaxFiles || 12;
    if (!prefix || !ext) return list;
    if (list.length >= max) return list;

    for (let i = list.length + 1; i <= max; i++) {
        const url = `${prefix}${i}${ext}`;
        try {
            const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
            if (!res.ok) break;
            list.push(url);
        } catch (e) {
            break;
        }
    }

    SITE_SETTINGS.breezeBackgrounds = list;
    return list;
}

function switchToRandomBreezeBackground() {
    const list = SITE_SETTINGS.breezeBackgrounds || [];
    if (list.length <= 1) return;

    let next = breezeIndex;
    while (next === breezeIndex) {
        next = Math.floor(Math.random() * list.length);
    }

    breezeIndex = next;
    switchBreezeSlot(list[next]);
    startBreezeTimer();
}

// 延后 1 秒暂停，等待 0.85s 空间淡出结束
function pauseBreezeBackground() {
    if (breezePauseTimer) clearTimeout(breezePauseTimer);
    breezePauseTimer = setTimeout(() => {
        breezePauseTimer = null;
        document.querySelectorAll('#breezeSlotA video, #breezeSlotB video').forEach(v => v.pause());
    }, 1000);
}

function resumeBreezeBackground() {
    if (breezePauseTimer) {
        clearTimeout(breezePauseTimer);
        breezePauseTimer = null;
    }

    const slot = document.getElementById(activeBreezeSlot === 'A' ? 'breezeSlotA' : 'breezeSlotB');
    if (!slot) return;

    slot.querySelectorAll('video.loop-video.active').forEach(v => {
        v.play().catch(() => {});
    });
}
