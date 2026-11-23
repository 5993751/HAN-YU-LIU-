/* 首页大厅逻辑：推荐作品轮播、标签页切换与懒加载 */

let currentSlide = 1;
let totalSlides = 1;
let slideTimer = null;
let slideDuration = 5500;
let activeFeaturedProject = null;

function initHomePage() {
    if (typeof SITE_SETTINGS === 'undefined' || typeof WORKS_DATA === 'undefined') return;

    initBreezeBackground();
    slideDuration = SITE_SETTINGS.homeSlideInterval || 5500;

    const readyPool = WORKS_DATA.projects.filter(isProjectReady);
    const firstProject = readyPool.length > 0
        ? readyPool[Math.floor(Math.random() * readyPool.length)]
        : WORKS_DATA.projects[0];
    renderFeaturedProject(firstProject);

    initArchive();
    initMasterMusicSystem();
    startAutoSlide();

    const stage = document.getElementById('feat-stage');
    if (stage) {
        stage.addEventListener('mouseenter', stopAutoSlide);
        stage.addEventListener('mouseleave', startAutoSlide);
    }
}

function renderFeaturedProject(project) {
    if (!project) return;
    const stage = document.getElementById('feat-stage');
    const dotsBox = document.getElementById('feat-dots');
    if (!stage || !dotsBox) return;

    stopAutoSlide();

    activeFeaturedProject = project;
    currentSlide = 1;
    totalSlides = project.items.length;

    const copy = getWorkCopy(project);
    const defaultBtn = (typeof SITE_TEXT !== 'undefined' && SITE_TEXT.home && SITE_TEXT.home.defaultEnterBtn)
        || '翻开这组作品 →';
    setText('feat-title-main', copy.title);
    setText('feat-title-sub', copy.date);
    setText('feat-desc', copy.intro);
    setText('feat-enter-btn', project.enterBtnText || defaultBtn);

    stage.innerHTML = '';
    dotsBox.innerHTML = '';

    project.items.forEach((item, idx) => {
        const isFirst = idx === 0 ? 'active' : '';
        const innerHTML = item.type === 'text'
            ? `<div class="text-only-card"><h3>${item.title}</h3><div class="text-only-body">${item.essay}</div></div>`
            : `<div class="art-frame-wrapper"><img data-src="${item.src}" alt="${item.title}"></div>`;

        stage.innerHTML += `<div class="showcase-slide ${isFirst}" data-index="${idx + 1}">${innerHTML}</div>`;
        dotsBox.innerHTML += `<span class="s-dot ${isFirst}" onclick="event.stopPropagation(); goSlide(${idx + 1})">${item.navChar}</span>`;
    });

    lazyLoadSlideImages(stage, 1);
    bindHomeSlideTilt(stage, project);
    updateLiveCard(1);
}

function bindHomeSlideTilt(stageEl, project) {
    stageEl.querySelectorAll('.showcase-slide img').forEach(img => {
        const applyTilt = () => {
            const frame = img.closest('.art-frame-wrapper');
            if (!frame) return;
            const angle = pickGalleryTilt(img, project);
            frame.style.setProperty('--tilt', angle ? angle.toFixed(2) + 'deg' : '0deg');
        };

        if (img.complete && img.naturalWidth) {
            applyTilt();
        } else {
            img.addEventListener('load', applyTilt, { once: true });
        }
    });
}

function refreshHomeFeatured() {
    if (typeof WORKS_DATA === 'undefined' || WORKS_DATA.projects.length === 0) return;

    const pool = WORKS_DATA.projects.filter(isProjectReady);
    if (pool.length === 0) return;

    const viewedId = currentGalleryProject ? currentGalleryProject.id : null;
    const shownId = activeFeaturedProject ? activeFeaturedProject.id : null;

    let candidates = pool.filter(p => p.id !== viewedId && p.id !== shownId);
    if (candidates.length === 0) candidates = pool.filter(p => p.id !== viewedId);
    if (candidates.length === 0) candidates = pool;

    renderFeaturedProject(candidates[Math.floor(Math.random() * candidates.length)]);
}

function updateLiveCard(index) {
    if (!activeFeaturedProject) return;
    if (!activeFeaturedProject.items[index - 1]) return;

    const numStr = String(index).padStart(2, '0') + ' / ' + String(totalSlides).padStart(2, '0');
    setText('live-num', numStr);

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

    slides.forEach(s => s.classList.toggle('active', parseInt(s.dataset.index, 10) === currentSlide));
    dots.forEach((d, idx) => d.classList.toggle('active', idx + 1 === currentSlide));

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
    const featuredView = document.getElementById('view-featured');
    if (document.body.classList.contains('mode-gallery') || !featuredView || !featuredView.classList.contains('active')) {
        return;
    }
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
        featuredView.classList.add('active');
        archiveView.classList.remove('active');
        btnFeatured.classList.add('active');
        btnArchive.classList.remove('active');
        startAutoSlide();
    } else {
        archiveView.classList.add('active');
        featuredView.classList.remove('active');
        btnArchive.classList.add('active');
        btnFeatured.classList.remove('active');
        stopAutoSlide();
    }
}
