/* =========================================================
   首页微风动态背景 (js/breeze.js)
   双视频 0ms 无缝接力：timeupdate 提前 0.15s 预判交接
   ========================================================= */

let breezeIdx = 0;
let activeBreezeSlot = 'A';

function setSlotMedia(slotEl, url) {
    if (!slotEl) return;
    const isVideo = /\.(mp4|webm)$/i.test(url);
    const slowRate = (typeof SITE_SETTINGS !== 'undefined' && SITE_SETTINGS.breezeSlowFactor) ? SITE_SETTINGS.breezeSlowFactor : 0.45;

    if (isVideo) {
        // ⭐ 删除了 style="width:100%;..." 这种画蛇添足的代码，完全交由外层 CSS 来控制 110% 满铺放大！
        slotEl.innerHTML = `
            <video src="${url}" muted playsinline preload="auto" class="breeze-clone clone-1 loop-video active"></video>
            <video src="${url}" muted playsinline preload="auto" class="breeze-clone clone-1 loop-video"></video>`;
        setupRelayLoop(slotEl, slowRate);
    } else {
        const clones = slotEl.querySelectorAll('.breeze-clone');
        clones.forEach(c => {
            c.style.backgroundImage = `url('${url}')`;
        });
    }
}

/* ⭐ 优化版双视频接力：利用 timeupdate 提前 0.15s 预判唤醒，彻底抹除卡顿 */
function setupRelayLoop(slotEl, rate) {
    const vids = slotEl.querySelectorAll('video.loop-video');
    if (vids.length < 2) return;
    let activeVid = vids[0];
    let standbyVid = vids[1];

    activeVid.playbackRate = rate;
    standbyVid.playbackRate = rate;

    const onTimeUpdate = (e) => {
        const vid = e.target;
        // 当视频距离结束只剩不到 0.15 秒时，提前唤醒备用视频
        if (vid.duration > 0 && (vid.duration - vid.currentTime) <= 0.15) {
            vid.removeEventListener('timeupdate', onTimeUpdate);
            standbyVid.currentTime = 0;

            standbyVid.play().then(() => {
                standbyVid.classList.add('active');
                vid.classList.remove('active');

                // 交接棒：互换身份
                let temp = activeVid;
                activeVid = standbyVid;
                standbyVid = temp;

                // 给新上任的 activeVid 重新绑上监听器
                activeVid.addEventListener('timeupdate', onTimeUpdate);
            }).catch(() => {});
        }
    };

    activeVid.addEventListener('timeupdate', onTimeUpdate);
    activeVid.play().catch(() => {});
}

function initBreezeBackground() {
    if (typeof SITE_SETTINGS === 'undefined' || !SITE_SETTINGS.breezeBackgrounds) return;
    const list = SITE_SETTINGS.breezeBackgrounds;
    if (list.length === 0) return;

    const slotA = document.getElementById('breezeSlotA');
    const slotB = document.getElementById('breezeSlotB');
    if (!slotA || !slotB) return;

    breezeIdx = 0;
    setSlotMedia(slotA, list[0]);
    slotA.classList.add('active');

    if (list.length > 1) {
        const intervalMs = (SITE_SETTINGS.breezeSwitchMinutes || 5) * 60 * 1000;
        setInterval(() => {
            breezeIdx = (breezeIdx + 1) % list.length;
            const nextUrl = list[breezeIdx];

            if (activeBreezeSlot === 'A') {
                setSlotMedia(slotB, nextUrl);
                slotB.classList.add('active');
                slotA.classList.remove('active');
                activeBreezeSlot = 'B';
            } else {
                setSlotMedia(slotA, nextUrl);
                slotA.classList.add('active');
                slotB.classList.remove('active');
                activeBreezeSlot = 'A';
            }
        }, intervalMs);
    }
}