/* =========================================================
   自动化策展逻辑引擎 (js/engine.js)
   ✨ 核心升级：
   1. 智能音乐同源判定：同曲100%无缝续播绝不重头开始，异曲平滑切换！
   2. 双视频无缝接力：采用 timeupdate 提前 0.15s 预判交接，彻底消除 ended 事件的延迟停顿！
   ========================================================= */

let currentSlide = 1;
let totalSlides = 1;
let slideTimer = null;
let slideDuration = 5500;
let activeFeaturedProject = null;

let hallPlaylist = [];
let hallTrackIndex = 0;
let activePlaylist = [];
let activeTrackIndex = 0;
let currentPlayingSrc = ""; 

let currentGalleryProject = null;
let currentChapter = 1;
let breezeIdx = 0;
let activeBreezeSlot = 'A';

function normalizeSrc(src) {
    if (!src) return "";
    const a = document.createElement('a');
    a.href = src;
    return a.href;
}

/* ==========================================
   1. 首页：微风背景动图初始化（双视频 0ms 无缝接力）
   ========================================== */
/* 替换 engine.js 里的 setSlotMedia 函数 */
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

/* ==========================================
   0. 转场动画与控制辅助函数
   ========================================== */
function revealPageCurtain() {
    const curtain = document.getElementById('pageCurtain');
    if (curtain) {
        setTimeout(() => curtain.classList.add('fade-out'), 60);
    }
}

function smoothNavigate(targetUrl) {
    const curtain = document.getElementById('pageCurtain');
    const activeAudio = document.getElementById('hallAudio') || document.getElementById('galAudio');
    if (activeAudio && !activeAudio.paused) fadeAudioOut(activeAudio, 650);

    if (curtain) {
        curtain.classList.remove('fade-out');
        setTimeout(() => { window.location.href = targetUrl; }, 720);
    } else {
        window.location.href = targetUrl;
    }
}

function fadeAudioOut(audioEl, duration) {
    const startVol = audioEl.volume;
    const steps = 15;
    const stepTime = duration / steps;
    let currentStep = 0;
    const timer = setInterval(() => {
        currentStep++;
        audioEl.volume = Math.max(0, startVol * (1 - currentStep / steps));
        if (currentStep >= steps) {
            clearInterval(timer);
            audioEl.pause();
            audioEl.volume = startVol;
        }
    }, stepTime);
}

function fadeAudioIn(audioEl, duration = 1200) {
    audioEl.volume = 0;
    audioEl.play().then(() => {
        const steps = 20;
        const stepTime = duration / steps;
        let currentStep = 0;
        const timer = setInterval(() => {
            currentStep++;
            audioEl.volume = Math.min(1, currentStep / steps);
            if (currentStep >= steps) clearInterval(timer);
        }, stepTime);
    }).catch(() => {});
}

/* ==========================================
   2. 首页逻辑装载
   ========================================== */
function initHomePage() {
    if (typeof SITE_SETTINGS === 'undefined' || typeof WORKS_DATA === 'undefined') return;

    initBreezeBackground();

    setText('ui-site-title', SITE_SETTINGS.siteTitle);
    setText('ui-site-subtitle', SITE_SETTINGS.siteSubtitle);
    setText('btn-featured', SITE_SETTINGS.navFeaturedText);
    setText('btn-archive', SITE_SETTINGS.navArchiveText);
    setText('ui-mood-date', SITE_SETTINGS.moodDate);
    setText('ui-mood-text', SITE_SETTINGS.moodText);
    setText('ui-archive-title', SITE_SETTINGS.archivePageTitle);
    setText('ui-archive-desc', SITE_SETTINGS.archivePageDesc);

    slideDuration = SITE_SETTINGS.homeSlideInterval || 5500;
    activeFeaturedProject = WORKS_DATA.projects.find(p => p.id === WORKS_DATA.featuredWorkId) || WORKS_DATA.projects[0];
    if (!activeFeaturedProject) return;

    setText('feat-tag', activeFeaturedProject.tag);
    setText('feat-title-main', activeFeaturedProject.titleMain);
    setText('feat-title-sub', activeFeaturedProject.titleSub);
    setText('feat-desc', activeFeaturedProject.homeIntro);
    setText('feat-enter-btn', activeFeaturedProject.enterBtnText || '翻开这组作品 →');

    const stage = document.getElementById('feat-stage');
    const dotsBox = document.getElementById('feat-dots');
    if (!stage || !dotsBox) return;

    totalSlides = activeFeaturedProject.items.length;
    stage.innerHTML = '';
    dotsBox.innerHTML = '';

    activeFeaturedProject.items.forEach((item, idx) => {
        const isFirst = idx === 0 ? 'active' : '';
        const innerHTML = item.type === 'text'
            ? `<div class="text-only-card"><h3>${item.title}</h3><p>${item.essay}</p></div>`
            : `<div class="art-frame-wrapper"><img src="${item.src}" alt="${item.title}"></div>`;

        stage.innerHTML += `<div class="showcase-slide ${isFirst}" data-index="${idx + 1}">${innerHTML}</div>`;
        dotsBox.innerHTML += `<span class="s-dot ${isFirst}" onclick="goSlide(${idx + 1})">${item.navChar}</span>`;
    });

    const archiveContainer = document.getElementById('archive-grid-container');
    if (archiveContainer) {
        archiveContainer.innerHTML = '';
        WORKS_DATA.projects.forEach(proj => {
            const clickAttr = proj.isReady ? `onclick="openGallerySpace('${proj.id}', 1)"` : '';
            // 如果作品还没准备好（isReady: false），就让它的透明度降低，不能点击
            const opacityStyle = proj.isReady ? '' : 'style="opacity: 0.45; cursor: default;"';
            
            // ⭐ 纯净文档列表结构：左边标题+副标题，右边日期，彻底抛弃封面图
            archiveContainer.innerHTML += `
                <div class="archive-list-item" ${clickAttr} ${opacityStyle}>
                    <div class="ali-left">
                        <h3 class="ali-title">${proj.titleMain} <span class="ali-sub">${proj.titleSub ? ' / ' + proj.titleSub : ''}</span></h3>
                    </div>
                    <div class="ali-right">
                        <span class="ali-date">${proj.archiveDate}</span>
                    </div>
                </div>
            `;
        });
    }

    initMasterMusicSystem();
    updateLiveCard(1);
    startAutoSlide();

    stage.addEventListener('mouseenter', stopAutoSlide);
    stage.addEventListener('mouseleave', startAutoSlide);
}

function updateLiveCard(index) {
    if (!activeFeaturedProject) return;
    const item = activeFeaturedProject.items[index - 1];
    if (!item) return;

    const numStr = String(index).padStart(2, '0') + ' / ' + String(totalSlides).padStart(2, '0');
    setText('live-num', numStr);
    setText('live-char', `${item.navChar} · ${item.title}`);

    const bar = document.getElementById('slide-progress');
    if (bar) {
        bar.style.transition = 'none';
        bar.style.width = '0%';
        setTimeout(() => {
            bar.style.transition = `width ${slideDuration}ms linear`;
            bar.style.width = '100%';
        }, 30);
    }
}

function showSlide(index) {
    const slides = document.querySelectorAll('.showcase-slide');
    const dots = document.querySelectorAll('.s-dot');
    if (slides.length === 0) return;

    if (index < 1) index = totalSlides;
    if (index > totalSlides) index = 1;
    currentSlide = index;

    slides.forEach(s => s.classList.toggle('active', parseInt(s.dataset.index) === currentSlide));
    dots.forEach((d, idx) => d.classList.toggle('active', idx + 1 === currentSlide));

    updateLiveCard(currentSlide);
}

function moveSlide(dir) {
    showSlide(currentSlide + dir);
    resetAutoSlide();
}

function goSlide(index) {
    showSlide(index);
    resetAutoSlide();
}

function enterGalleryAtCurrent() {
    if (!activeFeaturedProject) return;
    openGallerySpace(activeFeaturedProject.id, currentSlide);
}

function startAutoSlide() {
    stopAutoSlide();
    updateLiveCard(currentSlide);
    slideTimer = setInterval(() => { showSlide(currentSlide + 1); }, slideDuration);
}

function stopAutoSlide() {
    if (slideTimer) {
        clearInterval(slideTimer);
        slideTimer = null;
    }
    const bar = document.getElementById('slide-progress');
    if (bar) {
        bar.style.transition = 'none';
        bar.style.width = '0%';
    }
}

function resetAutoSlide() {
    stopAutoSlide();
    startAutoSlide();
}

function switchTab(tabName) {
    const featuredView = document.getElementById('view-featured');
    const archiveView = document.getElementById('view-archive');
    const btnFeatured = document.getElementById('btn-featured');
    const btnArchive = document.getElementById('btn-archive');
    if (!featuredView || !archiveView) return;

    if (tabName === 'featured') {
        document.body.classList.remove('mode-archive');
        featuredView.classList.add('active');
        archiveView.classList.remove('active');
        btnFeatured.classList.add('active');
        btnArchive.classList.remove('active');
        startAutoSlide();
    } else {
        document.body.classList.add('mode-archive');
        archiveView.classList.add('active');
        featuredView.classList.remove('active');
        btnArchive.classList.add('active');
        btnFeatured.classList.remove('active');
        stopAutoSlide();
    }
}

/* ==========================================
   3. 智能音乐系统（全局洗牌与同源比对切换）
   ========================================== */
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

/* ==========================================
   4. 万能展厅无刷新开启与折叠逻辑（已包含：换章切歌 + 回主页音乐继续播 + 第二篇专属宽银幕布局）
   ========================================== */
const themes = {
    'warm': '#f2ede2',
    'cool': '#e6e3da',
    'silent': '#eceae3',
    'remake': '#f0ece1',
    'abyss': '#1c1915',
    'limbo': '#f7f8f6',
    'sky': '#eef2ee',
    // ⭐ 新增：第一篇《泡沫与微光》9个章节的专属氛围背景色
    'w1-showa': '#ece4d5',   // 01 涌：昭和老照片低饱和暖褐纸色
    'w1-morandi': '#f2eae4', // 02 升：80年代百货莫兰迪暖粉米色
    'w1-gilded': '#f5ebd6',  // 03 繁：流金全盛期暖琥珀浅金
    'w1-golden-glow': '#f7f1e3',    // 04 光：金
    'w1-mirage': '#e4e7e6',  // 05 悬：高处幻象微冷青灰
    'w1-crash': '#1f2124',   // 06 裂：崩盘瞬间纪实冷峻铁灰（深色模式）
    'w1-ruins': '#ebecee',   // 07 寂：空城废墟清冷雾白
    'w1-gather': '#eaede6',  // 08 拾：写生浅苔绿温润纸色
    'w1-dawn': '#f4efe4'     // 09 留：平淡余温柔和晨光米色
};

function openGallerySpace(workId, startCh = 1) {
    currentGalleryProject = WORKS_DATA.projects.find(p => p.id === workId) || WORKS_DATA.projects[0];
    if (!currentGalleryProject) return;

    stopAutoSlide();

    const galContainer = document.getElementById('gal-container');
    const leftStage = document.getElementById('gal-left-stage');
    const rightNotes = document.getElementById('gal-right-notes');
    const footerDots = document.getElementById('gal-footer-dots');

    // ⭐ 判断是否为第2篇专属的“宽银幕电影感”布局
    if (galContainer) {
        galContainer.classList.toggle('cinematic-mode', currentGalleryProject.layoutMode === 'cinematic');
    }

    setText('gal-top-title', `${currentGalleryProject.titleMain} · ${currentGalleryProject.titleSub}`);
    leftStage.innerHTML = ''; rightNotes.innerHTML = ''; footerDots.innerHTML = '';

    currentGalleryProject.items.forEach((item, idx) => {
        const indexNum = idx + 1;
        leftStage.innerHTML += item.type === 'text'
            ? `<div class="gal-slide-item" data-index="${indexNum}"><div class="text-only-card"><h3>${item.title}</h3><p>${item.essay}</p></div></div>`
            : `<div class="gal-slide-item" data-index="${indexNum}"><div class="art-frame-wrapper"><img src="${item.src}" alt="${item.title}"></div></div>`;

        // 如果 footnote 为空，则完全不生成简评框
        const footnoteHTML = item.footnote ? `<div class="chapter-footnote"><span class="footnote-label">SCENE NOTE · 画面白描</span>${item.footnote}</div>` : '';

        rightNotes.innerHTML += `
            <div class="chapter-box" data-index="${indexNum}" data-theme="${item.theme || 'warm'}">
                <div class="chapter-badge">
                    <span class="badge-num">${item.badgeNum || String(indexNum).padStart(2, '0')}</span>
                    <span class="badge-divider">/</span>
                    <span class="badge-char">${item.navChar}</span>
                </div>
                <h2 class="chapter-title">${item.title}</h2>
                <div class="chapter-essay">${item.essay}</div>
                ${footnoteHTML}
            </div>
        `;

        footerDots.innerHTML += `<button class="nav-dot-btn" onclick="goToChapter(${indexNum})">${item.navChar}</button>`;
    });

    document.body.classList.remove('mode-home');
    document.body.classList.add('mode-gallery');
    document.getElementById('space-home').classList.remove('active');
    document.getElementById('space-gallery').classList.add('active');

    if (currentGalleryProject.bgm && currentGalleryProject.bgm.length > 0) {
        switchMusicContext(currentGalleryProject.bgm);
    }
    updateGallery(startCh);
}

function closeGalleryToHome() {
    document.body.classList.remove('mode-gallery', 'dark-chapter');
    document.body.classList.add('mode-home');
    document.body.style.backgroundColor = 'var(--paper-base)';

    document.getElementById('space-gallery').classList.remove('active');
    document.getElementById('space-home').classList.add('active');

    // ⭐ 修复第5点：从画廊返回主页时，绝对不再打断当前正在听的音乐！让它在主页继续播放！
    // 只把歌单列表补充回全局列表，但不触发切歌
    if (hallPlaylist.length > 0) {
        activePlaylist = hallPlaylist;
        const nextBtn = document.getElementById('globalNextBtn');
        if (nextBtn) nextBtn.style.display = activePlaylist.length > 1 ? 'inline-flex' : 'none';
    }
    startAutoSlide();
}

function updateGallery(index) {
    if (!currentGalleryProject) return;
    const total = currentGalleryProject.items.length;
    if (index < 1) index = total;
    if (index > total) index = 1;
    currentChapter = index;

    const slides = document.querySelectorAll('.gal-slide-item');
    slides.forEach(s => s.classList.toggle('active', parseInt(s.dataset.index) === currentChapter));

    const boxes = document.querySelectorAll('.chapter-box');
    let activeTheme = 'warm';
    boxes.forEach(b => {
        if (parseInt(b.dataset.index) === currentChapter) {
            b.classList.add('active');
            activeTheme = b.dataset.theme;
        } else {
            b.classList.remove('active');
        }
    });

    document.body.style.backgroundColor = themes[activeTheme] || '#f2ede2';
    // 如果是第一章深色主题(abyss)，自动把文字切换为柔和浅金色
    const isDarkTheme = (activeTheme === 'abyss' || activeTheme === 'w1-neon' || activeTheme === 'w1-crash');
    document.body.classList.toggle('dark-chapter', isDarkTheme);
    document.body.setAttribute('data-active-theme', activeTheme);

    // 每次翻页时，右侧长文章滚动条自动回到顶部
    const rightNotes = document.getElementById('gal-right-notes');
    if (rightNotes) rightNotes.scrollTop = 0;

    // ⭐ 这里就是帮你加好的“一章一曲自动切歌”逻辑！
    const currentItem = currentGalleryProject.items[currentChapter - 1];
    if (currentItem && currentItem.bgmSrc) {
        const itemTrack = { title: currentItem.bgmTitle || currentItem.title, src: currentItem.bgmSrc };
        if (normalizeSrc(itemTrack.src) !== currentPlayingSrc) {
            loadAndPlayTrack(itemTrack);
        }
    }

    const dots = document.querySelectorAll('.nav-dot-btn');
    dots.forEach((d, idx) => d.classList.toggle('active', idx + 1 === currentChapter));
}

function changeChapter(dir) {
    updateGallery(currentChapter + dir);
}

function goToChapter(index) {
    updateGallery(index);
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el && text !== undefined) el.textContent = text;
}

document.addEventListener('DOMContentLoaded', () => {
    revealPageCurtain();
    initHomePage();

    const params = new URLSearchParams(window.location.search);
    const workParam = params.get('work');
    const chParam = parseInt(params.get('chapter')) || 1;
    if (workParam) {
        openGallerySpace(workParam, chParam);
    }
});

document.addEventListener('keydown', (e) => {
    if (document.body.classList.contains('mode-gallery')) {
        if (e.key === 'ArrowRight') changeChapter(1);
        if (e.key === 'ArrowLeft') changeChapter(-1);
        if (e.key === 'Escape') closeGalleryToHome();
    } else {
        if (e.key === 'ArrowRight') moveSlide(1);
        if (e.key === 'ArrowLeft') moveSlide(-1);
    }
});