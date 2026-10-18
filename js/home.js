/* =========================================================
   首页大厅逻辑 (js/home.js)
   近期作品轮播 / 进度卡 / 文字导航点 / 标签页切换
   ⭐ 2026-10：轮播图片改为懒加载（浏览到才下载）
   ========================================================= */

let currentSlide = 1;
let totalSlides = 1;
let slideTimer = null;
let slideDuration = 5500;
let activeFeaturedProject = null;

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
        // ⭐ 改动 1：网址存进 data-src（不下载），翻到时才由 lazyLoadSlideImages 装载
        const innerHTML = item.type === 'text'
            ? `<div class="text-only-card"><h3>${item.title}</h3><p>${item.essay}</p></div>`
            : `<div class="art-frame-wrapper"><img data-src="${item.src}" alt="${item.title}"></div>`;

        stage.innerHTML += `<div class="showcase-slide ${isFirst}" data-index="${idx + 1}">${innerHTML}</div>`;
        dotsBox.innerHTML += `<span class="s-dot ${isFirst}" onclick="goSlide(${idx + 1})">${item.navChar}</span>`;
    });

    // ⭐ 改动 2：首屏只装载第 1、2 张（第 1 张正在展示，第 2 张预载备翻页）
    lazyLoadSlideImages(stage, 1);

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

    // ⭐ 改动 3：翻到哪张，才装载哪张和相邻两张
    lazyLoadSlideImages(document.getElementById('feat-stage'), currentSlide);

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