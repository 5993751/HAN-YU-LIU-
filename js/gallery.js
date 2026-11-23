/* 展厅页面渲染、章节切换、散落图序列与谢幕卡 */

let currentGalleryProject = null;
let currentChapter = 1;
let scatterTimers = [];
let archiveReturnScroll = null;
let finaleNextWork = null;

function clearScatterTimers() {
    scatterTimers.forEach(t => clearTimeout(t));
    scatterTimers = [];
}

function openGallerySpace(workId, startCh = 1) {
    currentGalleryProject = WORKS_DATA.projects.find(p => p.id === workId) || WORKS_DATA.projects[0];
    if (!currentGalleryProject) return;

    stopAutoSlide();
    pauseBreezeBackground();
    clearScatterTimers();
    hideFinaleOverlay();

    const archiveView = document.getElementById('view-archive');
    if (!document.body.classList.contains('mode-gallery') && archiveView && archiveView.classList.contains('active')) {
        archiveReturnScroll = archiveView.scrollTop;
    } else if (!archiveView || !archiveView.classList.contains('active')) {
        archiveReturnScroll = null;
    }

    playSpaceDissolve(() => renderGallerySpace(startCh));
}

function renderGallerySpace(startCh) {
    const galContainer = document.getElementById('gal-container');
    const leftStage = document.getElementById('gal-left-stage');
    const rightNotes = document.getElementById('gal-right-notes');
    const footerDots = document.getElementById('gal-footer-dots');

    if (galContainer) {
        galContainer.classList.toggle('cinematic-mode', currentGalleryProject.layoutMode === 'cinematic');
        galContainer.classList.toggle('minimal-scatter-mode', currentGalleryProject.layoutMode === 'minimal-scatter');
    }

    const galCopy = getWorkCopy(currentGalleryProject);
    const topTitleText = galCopy.date
        ? `${galCopy.title} · ${galCopy.date}`
        : galCopy.title;
    setText('gal-top-title', topTitleText);

    leftStage.innerHTML = '';
    rightNotes.innerHTML = '';
    footerDots.innerHTML = '';
    let footerTrackHTML = '';

    const scatterTitle = (typeof SITE_TEXT !== 'undefined' && SITE_TEXT.gallery && SITE_TEXT.gallery.scatterReplayTitle)
        || '轻触画面可重新播放这组记忆碎片';
    const items = currentGalleryProject.items || [];

    items.forEach((item, idx) => {
        const indexNum = idx + 1;

        if (item.scatterImages && item.scatterImages.length > 0) {
            const cardsHTML = item.scatterImages.map((sc, sIdx) => `
                <div class="scatter-card ${sc.isFinal ? 'is-final' : ''}" data-step="${sIdx}"
                     style="--sx:${sc.x || '0%'}; --sy:${sc.y || '0%'}; --srot:${sc.rot || '0deg'}; --sscale:${sc.scale || 1};">
                    <img data-src="${sc.src}" alt="">
                </div>
            `).join('');

            leftStage.innerHTML += `
                <div class="gal-slide-item scatter-stage-item" data-index="${indexNum}" onclick="replayScatterCurrent()" title="${scatterTitle}">
                    <div class="scatter-canvas">${cardsHTML}</div>
                </div>`;
        } else if (item.type === 'text') {
            leftStage.innerHTML += `
                <div class="gal-slide-item" data-index="${indexNum}">
                    <div class="text-only-card"><h3>${item.title}</h3><div class="text-only-body">${item.essay}</div></div>
                </div>`;
        } else {
            leftStage.innerHTML += `
                <div class="gal-slide-item" data-index="${indexNum}">
                    <div class="art-frame-wrapper"><img data-src="${item.src}" alt="${item.title}"></div>
                </div>`;
        }

        rightNotes.innerHTML += `
            <div class="chapter-box" data-index="${indexNum}" data-theme="${item.theme || 'warm'}">
                <div class="chapter-badge">
                    <span class="badge-num">${item.badgeNum || String(indexNum).padStart(2, '0')}</span>
                    <span class="badge-divider">/</span>
                    <span class="badge-char">${item.navChar}</span>
                </div>
                <h2 class="chapter-title">${item.title}</h2>
                <div class="chapter-essay">${item.essay}</div>
            </div>
        `;

        footerTrackHTML += `<button class="nav-dot-btn" onclick="goToChapter(${indexNum})">${item.navChar}</button>`;
    });

    footerDots.innerHTML = `<div class="footer-track">${footerTrackHTML}</div>`;

    document.body.classList.remove('mode-home');
    document.body.classList.add('mode-gallery');
    document.getElementById('space-home').classList.remove('active');
    document.getElementById('space-gallery').classList.add('active');

    let safeStart = parseInt(startCh, 10) || 1;
    if (items.length > 0) {
        if (safeStart < 1) safeStart = 1;
        if (safeStart > items.length) safeStart = items.length;
    }

    if (currentGalleryProject.bgm && currentGalleryProject.bgm.length > 0) {
        const startItem = items[safeStart - 1];
        const preferredSrc = startItem && startItem.bgmSrc ? startItem.bgmSrc : null;
        switchMusicContext(currentGalleryProject.bgm, preferredSrc);
    }

    updateGallery(safeStart);
}

function closeGalleryToHome() {
    clearScatterTimers();
    cancelChapterDissolve();
    hideFinaleOverlay();

    playSpaceDissolve(restoreHomeSpace);
}

function restoreHomeSpace() {
    const galContainer = document.getElementById('gal-container');
    if (galContainer) galContainer.classList.remove('cinematic-mode', 'minimal-scatter-mode');

    document.body.classList.remove('mode-gallery', 'dark-chapter');
    document.body.classList.add('mode-home');
    document.body.removeAttribute('data-active-theme');
    document.body.style.backgroundColor = 'var(--paper-base)';
    document.body.style.removeProperty('--chapter-drift');
    refreshAudioVizIdle();

    document.getElementById('space-gallery').classList.remove('active');
    document.getElementById('space-home').classList.add('active');

    if (hallPlaylist.length > 0) {
        activePlaylist = hallPlaylist;
        activeTrackIndex = findPlaylistIndex(currentPlayingSrc, activeTrackIndex);
        syncNextButtonVisibility();
    }

    resumeBreezeBackground();
    switchToRandomBreezeBackground();
    refreshHomeFeatured();

    const featuredView = document.getElementById('view-featured');
    if (featuredView && featuredView.classList.contains('active')) {
        startAutoSlide();
    }

    if (archiveReturnScroll !== null) {
        const archiveView = document.getElementById('view-archive');
        const targetTop = archiveReturnScroll;
        archiveReturnScroll = null;
        requestAnimationFrame(() => {
            if (archiveView) archiveView.scrollTop = targetTop;
        });
    }
}

function startScatterSequence(chapterIndex) {
    clearScatterTimers();
    if (!currentGalleryProject) return;
    const item = currentGalleryProject.items[chapterIndex - 1];
    if (!item || !item.scatterImages || item.scatterImages.length === 0) return;

    const slideEl = document.querySelector(`.gal-slide-item[data-index="${chapterIndex}"]`);
    if (!slideEl) return;

    slideEl.querySelectorAll('img[data-src]').forEach(img => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
    });

    const cards = slideEl.querySelectorAll('.scatter-card');
    if (cards.length === 0) return;

    cards.forEach(c => c.classList.remove('visible', 'fading-out'));

    const stepTime = item.scatterInterval || 3200;

    cards.forEach((card, idx) => {
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
    slides.forEach(s => s.classList.toggle('active', parseInt(s.dataset.index, 10) === currentChapter));

    lazyLoadSlideImages(document.getElementById('gal-left-stage'), currentChapter);
    startScatterSequence(currentChapter);

    const boxes = document.querySelectorAll('.chapter-box');
    let activeTheme = 'warm';
    boxes.forEach(b => {
        if (parseInt(b.dataset.index, 10) === currentChapter) {
            b.classList.add('active');
            activeTheme = b.dataset.theme;
        } else {
            b.classList.remove('active');
        }
    });

    const themeObj = resolveChapterTheme(activeTheme, currentGalleryProject);
    const baseColor = themeObj.color;
    const isDarkTheme = themeObj.dark;
    document.body.style.backgroundColor = baseColor;
    document.body.style.setProperty('--chapter-drift',
        shiftHueWash(baseColor, isDarkTheme ? 12 : -10, isDarkTheme ? 6 : -4, isDarkTheme ? 0.22 : 0.42));
    document.body.classList.toggle('dark-chapter', isDarkTheme);
    document.body.setAttribute('data-active-theme', activeTheme);
    refreshAudioVizIdle();

    const rightNotes = document.getElementById('gal-right-notes');
    if (rightNotes) rightNotes.scrollTop = 0;

    const galScrollBox = document.getElementById('gal-container');
    if (galScrollBox) galScrollBox.scrollTop = 0;
    if (window.innerWidth <= 900) window.scrollTo(0, 0);

    const currentItem = currentGalleryProject.items[currentChapter - 1];
    if (currentItem && currentItem.bgmSrc) {
        const itemTrack = { title: currentItem.bgmTitle || currentItem.title, src: currentItem.bgmSrc };
        if (normalizeSrc(itemTrack.src) !== currentPlayingSrc) {
            activeTrackIndex = findPlaylistIndex(itemTrack.src, activeTrackIndex);
            loadAndPlayTrack(itemTrack);
        }
    }

    const dots = document.querySelectorAll('.nav-dot-btn');
    dots.forEach((d, idx) => d.classList.toggle('active', idx + 1 === currentChapter));

    const activeDot = document.querySelector('.nav-dot-btn.active');
    if (activeDot) activeDot.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });

    applyGalleryTilt();
}

function changeChapter(dir) {
    const finaleEl = document.getElementById('finaleOverlay');
    if (finaleEl && finaleEl.classList.contains('show')) return;

    if (dir === 1 && currentGalleryProject && currentChapter >= currentGalleryProject.items.length) {
        showFinaleOverlay();
        return;
    }
    const targetChapter = currentChapter + dir;
    playChapterDissolve(() => updateGallery(targetChapter));
}

function goToChapter(index) {
    if (index === currentChapter) return;
    playChapterDissolve(() => updateGallery(index));
}

function pickRandomNextWork() {
    if (!currentGalleryProject) return null;
    const pool = WORKS_DATA.projects.filter(p =>
        p.id !== currentGalleryProject.id && isProjectReady(p)
    );
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
}

function showFinaleOverlay() {
    const overlay = document.getElementById('finaleOverlay');
    if (!overlay) {
        updateGallery(1);
        return;
    }

    finaleNextWork = pickRandomNextWork();

    const recSection = document.getElementById('finale-rec');
    const enterBtn = document.getElementById('finale-enter-btn');
    if (finaleNextWork) {
        if (recSection) recSection.style.display = '';
        if (enterBtn) enterBtn.style.display = '';
        const nextCopy = getWorkCopy(finaleNextWork);
        setText('finale-next-title', nextCopy.title);
        setText('finale-next-date', nextCopy.date);
    } else {
        if (recSection) recSection.style.display = 'none';
        if (enterBtn) enterBtn.style.display = 'none';
    }

    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function hideFinaleOverlay() {
    const overlay = document.getElementById('finaleOverlay');
    if (!overlay || !overlay.classList.contains('show')) return;
    overlay.classList.remove('show');
    document.body.style.overflow = '';
}

function finaleEnterNext() {
    if (!finaleNextWork) return;
    hideFinaleOverlay();
    openGallerySpace(finaleNextWork.id, 1);
}

function finaleReplayCurrent() {
    hideFinaleOverlay();
    goToChapter(1);
}

function finaleDismiss() {
    hideFinaleOverlay();
}
