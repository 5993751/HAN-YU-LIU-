/* =========================================================
   首页微风动态背景 (js/breeze.js)
   双视频 0ms 无缝接力：timeupdate 提前 0.15s 预判交接
   ========================================================= */

let breezeTimer = null;
let breezeIndex = 0;
let activeBreezeSlot = 'A';
let breezePauseTimer = null;

function setSlotMedia(slotEl, url) {
    if (!slotEl) return;
    const isVideo = /\.(mp4|webm)$/i.test(url);
    const slowRate = SITE_SETTINGS.breezeSlowFactor || 0.45;

    // 槽位被重新使用，作废上一次的延迟清理
    slotEl.dataset.releaseToken = '';

    if (isVideo) {
        // 尺寸完全交由外层 CSS 控制（110% 满铺放大）
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

/* 双视频接力：利用 timeupdate 提前 0.15s 预判唤醒，抹除循环卡顿 */
function setupRelayLoop(slotEl, rate) {
    const vids = slotEl.querySelectorAll('video.loop-video');
    if (vids.length < 2) return;
    let activeVid = vids[0];
    let standbyVid = vids[1];

    activeVid.playbackRate = rate;
    standbyVid.playbackRate = rate;

    const onTimeUpdate = (e) => {
        const vid = e.target;
        if (vid.duration > 0 && (vid.duration - vid.currentTime) <= 0.15) {
            vid.removeEventListener('timeupdate', onTimeUpdate);
            standbyVid.currentTime = 0;

            standbyVid.play().then(() => {
                standbyVid.classList.add('active');
                vid.classList.remove('active');

                let temp = activeVid;
                activeVid = standbyVid;
                standbyVid = temp;

                activeVid.addEventListener('timeupdate', onTimeUpdate);
            }).catch(() => {});
        }
    };

    activeVid.addEventListener('timeupdate', onTimeUpdate);
    activeVid.play().catch(() => {});
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

        // 6 秒淡出结束后，停掉旧背景，别让它继续占用带宽
        releaseSlotLater(fromSlot);
    };

    const video = nextSlot.querySelector('video.loop-video');
    if (!video) {
        reveal();
        return;
    }

    // 等新背景真正能播了再淡入；旧背景一直留在下面，不会出现空窗
    if (video.readyState >= 3) {
        reveal();
    } else {
        video.addEventListener('canplay', reveal, { once: true });
        setTimeout(reveal, 8000); // 兜底：新背景迟迟播不了时，最多让旧背景多停 8 秒
    }
}

/* 旧槽位淡出后释放：暂停、断开视频源，让浏览器停止下载 */
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

/* 首个背景真正能看了：通知进场幕布可以放行（js/loader.js 在等这个信号） */
function announceBreezeReady() {
    if (document.documentElement.dataset.breezeReady === '1') return;
    document.documentElement.dataset.breezeReady = '1';
    document.dispatchEvent(new CustomEvent('breeze:first-ready'));
}

async function initBreezeBackground() {
    // 先摸清目录里一共有几张，再随机抽第一张（只有一张时自然还是它）
    const list = await discoverBreezeBackgrounds();
    if (!list || list.length === 0) {
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

    // 视频要等能播了再算就绪；图片背景则铺上即可
    const firstVideo = slotA.querySelector('video.loop-video');
    if (firstVideo) {
        if (firstVideo.readyState >= 2) {
            announceBreezeReady();
        } else {
            firstVideo.addEventListener('canplay', announceBreezeReady, { once: true });
            setTimeout(announceBreezeReady, 6000); // 兜底：一直播不了也不挡人
        }
    } else {
        announceBreezeReady();
    }

    startBreezeTimer();
}

/* 按列表长度决定是否开启定时轮换（只有一张时什么都不做） */
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

/* 并发探测 bg-2、bg-3…（HEAD 只问“在不在”，不下载视频内容），
   只取从下一张开始连续存在的那一段，遇到缺口就停。
   命名规则在 data/site-settings.js 里配置，格式和 bg-1 保持一致即可。 */
async function discoverBreezeBackgrounds() {
    const list = SITE_SETTINGS.breezeBackgrounds || [];
    const prefix = SITE_SETTINGS.breezeFilePrefix;
    const ext = SITE_SETTINGS.breezeFileExt;
    const max = SITE_SETTINGS.breezeMaxFiles || 12;
    if (!prefix || !ext) return list;
    if (list.length >= max) return list;

    const probes = [];
    for (let i = list.length + 1; i <= max; i++) {
        const url = `${prefix}${i}${ext}`;
        probes.push(
            fetch(url, { method: 'HEAD', cache: 'no-store' })
                .then(res => res.ok)
                .catch(() => false)
        );
    }

    const results = await Promise.all(probes);
    for (let i = 0; i < results.length; i++) {
        if (!results[i]) break;
        list.push(`${prefix}${list.length + 1}${ext}`);
    }

    SITE_SETTINGS.breezeBackgrounds = list;
    return list;
}

/* 回到首页时立刻随机换一张（只有一张时保持不动） */
function switchToRandomBreezeBackground() {
    const list = SITE_SETTINGS.breezeBackgrounds || [];
    if (list.length <= 1) return;

    let next = breezeIndex;
    while (next === breezeIndex) {
        next = Math.floor(Math.random() * list.length);
    }

    breezeIndex = next;
    switchBreezeSlot(list[next]);
    startBreezeTimer(); // 重新计时，避免刚换完又被定时器换走
}

/* 进展厅时暂停背景视频，别让它在看不见的地方继续占带宽。
   等 1 秒是为了让 0.85s 的淡出先放完，不出现半路冻住的画面。 */
function pauseBreezeBackground() {
    if (breezePauseTimer) clearTimeout(breezePauseTimer);
    breezePauseTimer = setTimeout(() => {
        breezePauseTimer = null;
        document.querySelectorAll('#breezeSlotA video, #breezeSlotB video').forEach(v => v.pause());
    }, 1000);
}

/* 回到首页时恢复播放（换新背景时由新视频自己开播） */
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
