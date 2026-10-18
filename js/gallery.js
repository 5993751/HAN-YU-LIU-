/* =========================================================
   万能展厅 (js/gallery.js)
   逐章渲染 / 章节主题变色 / 换章切歌 / 记忆碎片零散浮现引擎
   观展终章 · 谢幕推荐卡
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
    hideFinaleOverlay(); // ⭐ 从谢幕卡"翻开它"进入新作品时，确保卡片已收起

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
    hideFinaleOverlay(); // ⭐ Esc / 返回按钮 / 谢幕卡"回到大厅"时，同步收起谢幕卡
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

/* ⭐ 核心引擎：启动当前章节的"多图零散浮现"序列（上一张淡淡隐去，下一张在另一处柔和浮现，直至最后一张定格） */
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
    // 谢幕卡片弹出期间，冻结翻页（避免键盘/滑动误操作背后的章节）
    const finaleEl = document.getElementById('finaleOverlay');
    if (finaleEl && finaleEl.classList.contains('show')) return;

    // ⭐ 观展终章：最后一章继续向后翻时，不再循环回第一章，
    // 而是弹出谢幕卡片，随机推荐下一间展厅
    if (dir === 1 && currentGalleryProject && currentChapter >= currentGalleryProject.items.length) {
        showFinaleOverlay();
        return;
    }
    updateGallery(currentChapter + dir);
}

function goToChapter(index) {
    updateGallery(index);
}

/* =========================================================
   ⭐ 观展终章 · 谢幕推荐卡（finale 系列）
   最后一章继续向后翻 → 弹出谢幕卡：谢幕语 + 随机推荐下一间展厅
   按钮：翻开它 / 再看一遍 / 回到大厅；点卡片外暗处 = 留在原地
   ========================================================= */
let finaleNextWork = null; // 本次谢幕卡抽中的推荐作品

/* 从其他已上架作品中随机抽一部（排除当前作品；isReady 为 false 的草稿不参与） */
function pickRandomNextWork() {
    if (!currentGalleryProject) return null;
    const pool = WORKS_DATA.projects.filter(p =>
        p.id !== currentGalleryProject.id && p.isReady !== false // 没写 isReady 字段的作品默认视为已上架
    );
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
}

/* 弹出谢幕卡：填充谢幕语与推荐位，并锁定背景滚动 */
function showFinaleOverlay() {
    const overlay = document.getElementById('finaleOverlay');
    if (!overlay) {
        // 保险：HTML 未就绪时退回旧的循环翻页行为，避免卡死在最后一章
        updateGallery(1);
        return;
    }

    finaleNextWork = pickRandomNextWork();

    // 推荐位：抽得到其他作品才显示，否则整块隐藏
    const recSection = document.getElementById('finale-Rec');
    if (finaleNextWork) {
        if (recSection) recSection.style.display = '';
                setText('finale-next-title', finaleNextWork.titleMain);
        setText('finale-next-date', finaleNextWork.titleSub || '');
    } else {
        if (recSection) recSection.style.display = 'none';
    }

    overlay.classList.add('show');
    document.body.style.overflow = 'hidden'; // 锁住背后展厅的滚动（手机端尤其需要）
}

/* 收起谢幕卡，恢复滚动 */
function hideFinaleOverlay() {
    const overlay = document.getElementById('finaleOverlay');
    if (!overlay || !overlay.classList.contains('show')) return;
    overlay.classList.remove('show');
    document.body.style.overflow = '';
}

/* 按钮：翻开推荐作品（从头读起） */
function finaleEnterNext() {
    if (!finaleNextWork) return;
    hideFinaleOverlay();
    openGallerySpace(finaleNextWork.id, 1);
}

/* 按钮：再看一遍（回到当前作品第 1 章） */
function finaleReplayCurrent() {
    hideFinaleOverlay();
    goToChapter(1);
}

/* 点击卡片外的暗色区域：收起卡片，留在最后一章 */
function finaleDismiss() {
    hideFinaleOverlay();
}