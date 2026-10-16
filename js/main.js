/* ==========================================
   1. 首页数据初始化（从 projects-data.js 自动装载）
   ========================================== */
let currentSlide = 1;
let totalSlides = 9;
let slideTimer = null;
let slideDuration = 5500; // 默认 5.5 秒慢速优雅切换

function initHomePage() {
    if (typeof SITE_DATA === 'undefined') return;
    const feat = SITE_DATA.featuredProject;
    const stage = document.getElementById('feat-stage');
    const dotsBox = document.getElementById('feat-dots');
    if (!stage || !dotsBox) return;

    // 填充左侧标题与介绍文案
    document.getElementById('feat-tag').textContent = feat.tag;
    document.getElementById('feat-title-main').textContent = feat.titleMain;
    document.getElementById('feat-title-sub').textContent = feat.titleSub;
    document.getElementById('feat-desc').textContent = feat.description;

    totalSlides = feat.slides.length;
    slideDuration = feat.slideInterval || 5500;

    // 自动生成右侧海报与左侧 9 字导航
    stage.innerHTML = '';
    dotsBox.innerHTML = '';

    feat.slides.forEach((item, idx) => {
        const isFirst = idx === 0 ? 'active' : '';
        stage.innerHTML += `
            <div class="showcase-slide ${isFirst}" data-index="${item.id}">
                <img src="${item.img}" alt="${item.char}">
            </div>
        `;
        dotsBox.innerHTML += `
            <span class="s-dot ${isFirst}" onclick="goSlide(${item.id})">${item.char}</span>
        `;
    });

    // 初始化作品集网格
    const archiveContainer = document.getElementById('archive-grid-container');
    if (archiveContainer && SITE_DATA.archiveList) {
        archiveContainer.innerHTML = '';
        SITE_DATA.archiveList.forEach(work => {
            const clickAction = work.isReady ? `onclick="location.href='${work.url}'"` : '';
            const imgContent = work.cover
                ? `<div class="archive-img-box"><img src="${work.cover}" alt="${work.title}"></div>`
                : `<div class="archive-img-box placeholder-box"><span>${work.placeholderText}</span></div>`;
            archiveContainer.innerHTML += `
                <div class="archive-item" ${clickAction}>
                    ${imgContent}
                    <div class="archive-info">
                        <span class="archive-date">${work.date}</span>
                        <h3>${work.title}</h3>
                    </div>
                </div>
            `;
        });
    }

    updateLiveCard(1);
    startAutoSlide();

    // 鼠标移到画面上时暂停轮播，移开恢复
    stage.addEventListener('mouseenter', stopAutoSlide);
    stage.addEventListener('mouseleave', startAutoSlide);
}

function updateLiveCard(index) {
    if (typeof SITE_DATA === 'undefined') return;
    const item = SITE_DATA.featuredProject.slides[index - 1];
    if (!item) return;

    const numStr = String(item.id).padStart(2, '0') + ' / ' + String(totalSlides).padStart(2, '0');
    const numEl = document.getElementById('live-num');
    const charEl = document.getElementById('live-char');
    if (numEl) numEl.textContent = numStr;
    if (charEl) charEl.textContent = `${item.char} · ${item.name}`;

    // 重置并启动 5.5 秒进度细线动画
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

    slides.forEach(slide => {
        slide.classList.toggle('active', parseInt(slide.dataset.index) === currentSlide);
    });

    dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx + 1 === currentSlide);
    });

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
    const url = (typeof SITE_DATA !== 'undefined') ? SITE_DATA.featuredProject.galleryUrl : 'gallery-golden-age.html';
    window.location.href = `${url}?chapter=${currentSlide}`;
}

function startAutoSlide() {
    stopAutoSlide();
    updateLiveCard(currentSlide);
    slideTimer = setInterval(() => {
        showSlide(currentSlide + 1);
    }, slideDuration);
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

/* ==========================================
   2. 首页「当前展映 / 作品集」切换逻辑
   ========================================== */
function switchTab(tabName) {
    const featuredView = document.getElementById('view-featured');
    const archiveView = document.getElementById('view-archive');
    const btnFeatured = document.getElementById('btn-featured');
    const btnArchive = document.getElementById('btn-archive');

    if (!featuredView || !archiveView) return;

    if (tabName === 'featured') {
        featuredView.classList.add('active');
        archiveView.classList.remove('active');
        btnFeatured.classList.add('active');
        btnArchive.classList.remove('active');
        startAutoSlide();
    } else if (tabName === 'archive') {
        archiveView.classList.add('active');
        featuredView.classList.remove('active');
        btnArchive.classList.add('active');
        btnFeatured.classList.remove('active');
        stopAutoSlide();
    }
}

/* ==========================================
   3. 画廊内页：翻页、URL章节定位与背景呼吸
   ========================================== */
let currentChapter = 1;
const totalChapters = 9;

const themes = {
    'warm': '#f7f6f2',
    'cool': '#ebece6',
    'silent': '#f1f1ee',
    'remake': '#f5f3ec'
};

function updateGallery(index) {
    const images = document.querySelectorAll('.poster-img');
    if (images.length === 0) return;

    if (index < 1) index = totalChapters;
    if (index > totalChapters) index = 1;
    currentChapter = index;

    images.forEach(img => {
        img.classList.toggle('active', parseInt(img.dataset.index) === currentChapter);
    });

    const boxes = document.querySelectorAll('.chapter-box');
    let activeTheme = 'warm';
    boxes.forEach(box => {
        if (parseInt(box.dataset.index) === currentChapter) {
            box.classList.add('active');
            activeTheme = box.dataset.theme;
        } else {
            box.classList.remove('active');
        }
    });

    document.body.style.backgroundColor = themes[activeTheme] || '#f7f6f2';

    const dots = document.querySelectorAll('.nav-dot-btn');
    dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx + 1 === currentChapter);
    });
}

function changeChapter(direction) {
    updateGallery(currentChapter + direction);
}

function goToChapter(index) {
    updateGallery(index);
}

function toggleBGM() {
    const audio = document.getElementById('bgmAudio');
    const btn = document.getElementById('bgmToggle');
    if (!audio) return;
    if (audio.paused) {
        audio.play();
        btn.textContent = '♫ 正在播放展厅配乐';
        btn.style.borderColor = 'var(--text-main)';
    } else {
        audio.pause();
        btn.textContent = '♪ 开启展厅配乐';
        btn.style.borderColor = 'var(--border-color)';
    }
}

/* ==========================================
   4. 页面启动入口与键盘方向键支持
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {
    initHomePage();

    const params = new URLSearchParams(window.location.search);
    const ch = parseInt(params.get('chapter'));
    if (ch >= 1 && ch <= 9) {
        updateGallery(ch);
    }
});

document.addEventListener('keydown', (e) => {
    if (document.querySelector('.gallery-container')) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') changeChapter(1);
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') changeChapter(-1);
    } else if (document.querySelector('.featured-split-layout')) {
        if (e.key === 'ArrowRight') moveSlide(1);
        if (e.key === 'ArrowLeft') moveSlide(-1);
    }
});