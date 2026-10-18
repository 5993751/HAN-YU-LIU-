/* =========================================================
   万能展厅 (js/gallery.js)
   逐章渲染 / 章节主题变色（色彩表见 data/themes.js）/ 换章切歌
   ⭐ 2026-10：章节图片懒加载 + 手机端翻章自动回顶修复
   ========================================================= */

let currentGalleryProject = null;
let currentChapter = 1;

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
        // ⭐ 改动 1：网址存进 data-src（不下载），翻章时才由 updateGallery 装载
        leftStage.innerHTML += item.type === 'text'
            ? `<div class="gal-slide-item" data-index="${indexNum}"><div class="text-only-card"><h3>${item.title}</h3><p>${item.essay}</p></div></div>`
            : `<div class="gal-slide-item" data-index="${indexNum}"><div class="art-frame-wrapper"><img data-src="${item.src}" alt="${item.title}"></div></div>`;

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

    // ⭐ 改动 2：翻到哪章，才装载哪章和相邻两章的图片
    lazyLoadSlideImages(document.getElementById('gal-left-stage'), currentChapter);

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
    // 深色主题自动把文字切换为柔和浅色（名单统一放在 data/themes.js 的 DARK_THEMES）
    const isDarkTheme = DARK_THEMES.includes(activeTheme);
    document.body.classList.toggle('dark-chapter', isDarkTheme);
    document.body.setAttribute('data-active-theme', activeTheme);

    // 每次翻页时，右侧长文章滚动条自动回到顶部
    const rightNotes = document.getElementById('gal-right-notes');
    if (rightNotes) rightNotes.scrollTop = 0;

    // ⭐ 改动 3：手机端布局下滚动条在外层容器上，同步归零（电脑端该容器
    // 不可滚动，下面两行等于空操作，零影响）——修复手机翻章停在上次位置
    const galScrollBox = document.getElementById('gal-container');
    if (galScrollBox) galScrollBox.scrollTop = 0;

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