/* =========================================================
   万能展厅 (js/gallery.js)
   逐章渲染 / 章节主题变色 / 换章切歌 / 记忆碎片零散浮现引擎
   ========================================================= */

let currentGalleryProject = null;
let currentChapter = 1;
let scatterTimers = []; // 记录多图散落浮现的定时器，翻页时随时清理

function clearScatterTimers() {
    scatterTimers.forEach(t => clearTimeout(t));
    scatterTimers = [];
}

function openGallerySpace(workId, startCh = 1) {
    currentGalleryProject = WORKS_DATA.projects.find(p => p.id === workId) || WORKS_DATA.projects[0];
    if (!currentGalleryProject) return;

    stopAutoSlide();
    clearScatterTimers();

    const galContainer = document.getElementById('gal-container');
    const leftStage = document.getElementById('gal-left-stage');
    const rightNotes = document.getElementById('gal-right-notes');
    const footerDots = document.getElementById('gal-footer-dots');

    if (galContainer) {
        galContainer.classList.toggle('cinematic-mode', currentGalleryProject.layoutMode === 'cinematic');
        galContainer.classList.toggle('minimal-scatter-mode', currentGalleryProject.layoutMode === 'minimal-scatter');
    }

    // ⭐ 若无副标题（如第3篇），顶栏只显示主标题，不出现多余圆点
    const topTitleText = currentGalleryProject.titleSub
        ? `${currentGalleryProject.titleMain} · ${currentGalleryProject.titleSub}`
        : currentGalleryProject.titleMain;
    setText('gal-top-title', topTitleText);

    leftStage.innerHTML = ''; rightNotes.innerHTML = ''; footerDots.innerHTML = '';

    currentGalleryProject.items.forEach((item, idx) => {
        const indexNum = idx + 1;

        // ⭐ 判断是否配置了多图零散浮现数组 (scatterImages)
        if (item.scatterImages && item.scatterImages.length > 0) {
            const cardsHTML = item.scatterImages.map((sc, sIdx) => `
                <div class="scatter-card ${sc.isFinal ? 'is-final' : ''}" data-step="${sIdx}"
                     style="--sx:${sc.x || '0%'}; --sy:${sc.y || '0%'}; --srot:${sc.rot || '0deg'}; --sscale:${sc.scale || 1};">
                    <img data-src="${sc.src}" alt="">
                </div>
            `).join('');

            leftStage.innerHTML += `
                <div class="gal-slide-item scatter-stage-item" data-index="${indexNum}" onclick="replayScatterCurrent()" title="轻触画面可重新播放这组记忆碎片">
                    <div class="scatter-canvas">${cardsHTML}</div>
                </div>`;
        } else if (item.type === 'text') {
            leftStage.innerHTML += `
                <div class="gal-slide-item" data-index="${indexNum}">
                    <div class="text-only-card"><h3>${item.title}</h3><p>${item.essay}</p></div>
                </div>`;
        } else {
            leftStage.innerHTML += `
                <div class="gal-slide-item" data-index="${indexNum}">
                    <div class="art-frame-wrapper"><img data-src="${item.src}" alt="${item.title}"></div>
                </div>`;
        }

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
    clearScatterTimers();
    const galContainer = document.getElementById('gal-container');
    if (galContainer) galContainer.classList.remove('cinematic-mode', 'minimal-scatter-mode');

    document.body.classList.remove('mode-gallery', 'dark-chapter');
    document.body.classList.add('mode-home');
    document.body.style.backgroundColor = 'var(--paper-base)';

    document.getElementById('space-gallery').classList.remove('active');
    document.getElementById('space-home').classList.add('active');

    if (hallPlaylist.length > 0) {
        activePlaylist = hallPlaylist;
        const nextBtn = document.getElementById('globalNextBtn');
        if (nextBtn) nextBtn.style.display = activePlaylist.length > 1 ? 'inline-flex' : 'none';
    }
    startAutoSlide();
}

/* ⭐ 核心引擎：启动当前章节的“多图零散浮现”序列（上一张淡淡隐去，下一张在另一处柔和浮现，直至最后一张定格） */
function startScatterSequence(chapterIndex) {
    clearScatterTimers();
    if (!currentGalleryProject) return;
    const item = currentGalleryProject.items[chapterIndex - 1];
    if (!item || !item.scatterImages || item.scatterImages.length === 0) return;

    const slideEl = document.querySelector(`.gal-slide-item[data-index="${chapterIndex}"]`);
    if (!slideEl) return;

    // 预装载本章所有碎片图片
    slideEl.querySelectorAll('img[data-src]').forEach(img => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
    });

    const cards = slideEl.querySelectorAll('.scatter-card');
    if (cards.length === 0) return;

    // 重置所有碎片状态
    cards.forEach(c => c.classList.remove('visible', 'fading-out'));

    const stepTime = item.scatterInterval || 3200;

    cards.forEach((card, idx) => {
        // 依次浮现
        const showTimer = setTimeout(() => {
            if (idx > 0) {
                cards[idx - 1].classList.remove('visible');
                cards[idx - 1].classList.add('fading-out');
            }
            card.classList.remove('fading-out');
            card.classList.add('visible');
        }, idx * stepTime + 80);

        scatterTimers.push(showTimer);
    });
}

function replayScatterCurrent() {
    startScatterSequence(currentChapter);
}

function updateGallery(index) {
    if (!currentGalleryProject) return;
    const total = currentGalleryProject.items.length;
    if (index < 1) index = total;
    if (index > total) index = 1;
    currentChapter = index;

    const slides = document.querySelectorAll('.gal-slide-item');
    slides.forEach(s => s.classList.toggle('active', parseInt(s.dataset.index) === currentChapter));

    lazyLoadSlideImages(document.getElementById('gal-left-stage'), currentChapter);

    // ⭐ 若当前章是多图散落模式，立即启动散落浮现序列
    startScatterSequence(currentChapter);

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
    const isDarkTheme = DARK_THEMES.includes(activeTheme);
    document.body.classList.toggle('dark-chapter', isDarkTheme);
    document.body.setAttribute('data-active-theme', activeTheme);

    const rightNotes = document.getElementById('gal-right-notes');
    if (rightNotes) rightNotes.scrollTop = 0;

    const galScrollBox = document.getElementById('gal-container');
    if (galScrollBox) galScrollBox.scrollTop = 0;
    if (window.innerWidth <= 900) window.scrollTo(0, 0);

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