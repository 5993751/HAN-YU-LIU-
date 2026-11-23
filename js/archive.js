/* 个人记录列表：分类筛选、搜索、排序与键盘直达 */

const ARCHIVE_ALL_CATEGORY = (typeof SITE_TEXT !== 'undefined' && SITE_TEXT.archive && SITE_TEXT.archive.allCategory) || '全部';

let archiveCategory = ARCHIVE_ALL_CATEGORY;
let archiveQuery = '';
let archiveSort = 'default';
let hoveredArchiveItem = null;
let archiveHoverKeyBound = false;
let archiveOpening = false;

const archiveTitleCollator = new Intl.Collator('zh-Hans-CN', { sensitivity: 'base' });

function initArchive() {
    if (typeof WORKS_DATA === 'undefined') return;
    renderArchiveFilters();
    bindArchiveToolbar();
    renderArchiveList();
    initArchiveStickyState();
}

function initArchiveStickyState() {
    const toolbar = document.querySelector('.archive-toolbar');
    const scroller = document.getElementById('view-archive');
    if (!toolbar || !scroller || !('IntersectionObserver' in window)) return;

    const sentinel = document.createElement('div');
    sentinel.className = 'archive-toolbar-sentinel';
    toolbar.parentNode.insertBefore(sentinel, toolbar);

    const observer = new IntersectionObserver((entries) => {
        toolbar.classList.toggle('is-stuck', !entries[0].isIntersecting);
    }, { root: scroller, threshold: 0 });

    observer.observe(sentinel);

    requestAnimationFrame(() => {
        const scrollerTop = scroller.getBoundingClientRect().top;
        const sentinelTop = sentinel.getBoundingClientRect().top;
        toolbar.classList.toggle('is-stuck', sentinelTop < scrollerTop);
    });
}

function parseArchiveDate(dateStr) {
    if (!dateStr) return 0;
    const parts = String(dateStr).split(/[.\-/]/).map(n => parseInt(n, 10) || 0);
    if (!parts[0]) return 0;
    return new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1).getTime();
}

function renderArchiveFilters() {
    const box = document.getElementById('archive-filters');
    if (!box) return;

    const categories = [ARCHIVE_ALL_CATEGORY];
    WORKS_DATA.projects.forEach(proj => {
        if (proj.category && !categories.includes(proj.category)) {
            categories.push(proj.category);
        }
    });

    box.innerHTML = categories.map(name => {
        const active = name === archiveCategory ? ' active' : '';
        return `<button type="button" class="archive-filter-btn${active}" data-category="${name}" aria-pressed="${name === archiveCategory}">${name}</button>`;
    }).join('');
}

function bindArchiveToolbar() {
    const filters = document.getElementById('archive-filters');
    const search = document.getElementById('archive-search');
    const sortBox = document.getElementById('archive-sort');

    if (filters) {
        filters.addEventListener('click', (e) => {
            const btn = e.target.closest('.archive-filter-btn');
            if (!btn) return;
            archiveCategory = btn.dataset.category;
            filters.querySelectorAll('.archive-filter-btn').forEach(b => {
                const isActive = b === btn;
                b.classList.toggle('active', isActive);
                b.setAttribute('aria-pressed', String(isActive));
            });
            renderArchiveList();
        });
    }

    if (search) {
        search.addEventListener('input', () => {
            archiveQuery = search.value.trim().toLowerCase();
            renderArchiveList();
        });
    }

    if (sortBox) {
        sortBox.addEventListener('click', (e) => {
            const btn = e.target.closest('.archive-sort-btn');
            if (!btn) return;
            archiveSort = btn.dataset.sort;
            sortBox.querySelectorAll('.archive-sort-btn').forEach(b => {
                b.classList.toggle('active', b === btn);
            });
            renderArchiveList();
        });
    }

    const grid = document.getElementById('archive-grid-container');
    if (grid && !archiveHoverKeyBound) {
        grid.addEventListener('mouseover', (e) => {
            hoveredArchiveItem = e.target.closest ? e.target.closest('.archive-item[data-work]') : null;
        });
        grid.addEventListener('mouseleave', () => {
            hoveredArchiveItem = null;
        });
        document.addEventListener('keydown', handleArchiveItemKey);
        archiveHoverKeyBound = true;
    }
}

function handleArchiveItemKey(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if (e.isComposing || isTypingTarget(e.target) || isCurtainBlocking()) return;
    if (document.body.classList.contains('mode-gallery')) return;

    const archiveView = document.getElementById('view-archive');
    if (!archiveView || !archiveView.classList.contains('active')) return;

    const item = hoveredArchiveItem && document.contains(hoveredArchiveItem) ? hoveredArchiveItem : null;
    if (!item) return;

    e.preventDefault();
    handleArchiveOpen(item);
}

function getProjectSortDate(proj) {
    return getWorkCopy(proj).date;
}

function getVisibleProjects() {
    let list = WORKS_DATA.projects.filter(proj => {
        const matchCategory = archiveCategory === ARCHIVE_ALL_CATEGORY || proj.category === archiveCategory;
        if (!matchCategory) return false;
        if (!archiveQuery) return true;

        const copy = getWorkCopy(proj);
        const haystack = [
            copy.title,
            copy.date,
            proj.category
        ].filter(Boolean).join(' ').toLowerCase();

        return haystack.includes(archiveQuery);
    });

    if (archiveSort === 'default') {
        list = list.slice().sort((a, b) => {
            const byName = archiveTitleCollator.compare(
                getWorkCopy(a).title,
                getWorkCopy(b).title
            );
            if (byName !== 0) return byName;
            return parseArchiveDate(getProjectSortDate(b)) - parseArchiveDate(getProjectSortDate(a));
        });
    } else if (archiveSort === 'newest') {
        list = list.slice().sort((a, b) => parseArchiveDate(getProjectSortDate(b)) - parseArchiveDate(getProjectSortDate(a)));
    } else if (archiveSort === 'oldest') {
        list = list.slice().sort((a, b) => parseArchiveDate(getProjectSortDate(a)) - parseArchiveDate(getProjectSortDate(b)));
    }

    return list;
}

function highlightArchiveTitle(title) {
    if (!archiveQuery) return title;
    const index = title.toLowerCase().indexOf(archiveQuery);
    if (index === -1) return title;
    const end = index + archiveQuery.length;
    return `${title.slice(0, index)}<mark class="ai-hit">${title.slice(index, end)}</mark>${title.slice(end)}`;
}

function splitArchiveDate(dateText) {
    const parts = String(dateText).split('.');
    if (parts.length < 2) return { year: '', day: dateText };
    return { year: parts[0], day: parts.slice(1).join('.') };
}

function renderArchiveList() {
    const container = document.getElementById('archive-grid-container');
    const emptyTip = document.getElementById('archive-empty');
    if (!container) return;

    const projects = getVisibleProjects();

    container.innerHTML = projects.map(proj => {
        const copy = getWorkCopy(proj);
        const date = splitArchiveDate(copy.date);
        const ready = isProjectReady(proj);
        // effects.css 通过 [onclick] 区分已上架条目并启用滚动浮现
        const clickAttr = ready ? 'onclick="handleArchiveOpen(this)"' : '';
        const workAttr = ready ? `data-work="${proj.id}"` : '';
        const lockedClass = ready ? '' : ' is-locked';
        const opacityStyle = ready ? '' : 'style="opacity: 0.45;"';
        const titleText = copy.title;
        const summary = copy.intro
            ? `<p class="ai-summary">${copy.intro}</p>`
            : '';

        return `
            <article class="archive-item${lockedClass}" ${clickAttr} ${workAttr} ${opacityStyle}>
                <div class="ai-date">
                    <span class="ai-year">${date.year}</span>
                    <span class="ai-day">${date.day}</span>
                </div>
                <div class="ai-main">
                    <h3 class="ai-title">${highlightArchiveTitle(titleText)}</h3>
                    ${summary}
                </div>
                <div class="ai-tail">
                    <span class="ai-category">${proj.category || ''}</span>
                    <span class="ai-arrow" aria-hidden="true">→</span>
                </div>
            </article>
        `;
    }).join('') + (projects.length ? '<p class="archive-end" aria-hidden="true">·</p>' : '');

    if (emptyTip) emptyTip.style.display = projects.length ? 'none' : 'block';
}

function handleArchiveOpen(item) {
    if (!item) return;
    const workId = item.dataset.work;
    if (!workId || archiveOpening) return;

    archiveOpening = true;
    item.classList.add('is-entering');
    setTimeout(() => {
        archiveOpening = false;
        item.classList.remove('is-entering');
        openGallerySpace(workId, 1);
    }, 120);
}
