/* =========================================================
   个人记录列表 (js/archive.js)
   分类筛选 / 关键词搜索 / 排序
   · 默认按标题首字母（汉字按拼音）排序，同首字母时新的在前
   · 分类按钮从作品的 category 字段自动生成，新增作品无需改本文件
   ========================================================= */

let archiveCategory = '全部';
let archiveQuery = '';
let archiveSort = 'default';
let hoveredArchiveItem = null;
let archiveHoverKeyBound = false;
let archiveOpening = false;

/* 汉字按拼音排序：zh-Hans-CN 的 collation 即拼音顺序 */
const archiveTitleCollator = new Intl.Collator('zh-Hans-CN', { sensitivity: 'base' });

function initArchive() {
    if (typeof WORKS_DATA === 'undefined') return;
    renderArchiveFilters();
    bindArchiveToolbar();
    renderArchiveList();
    initArchiveStickyState();
}

/* 工具栏静止时完全透明；真正吸顶、下方有内容经过时才浮出磨砂纸 */
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

    // 视图从隐藏切到显示时，先按当前位置校准一次，避免闪出一层底色
    requestAnimationFrame(() => {
        const scrollerTop = scroller.getBoundingClientRect().top;
        const sentinelTop = sentinel.getBoundingClientRect().top;
        toolbar.classList.toggle('is-stuck', sentinelTop < scrollerTop);
    });
}

/* 把 "2026.9.30" / "2026-09-30" / "2026/9/30" 统一转成可比较的时间戳 */
function parseArchiveDate(dateStr) {
    if (!dateStr) return 0;
    const parts = String(dateStr).split(/[.\-/]/).map(n => parseInt(n, 10) || 0);
    if (!parts[0]) return 0;
    return new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1).getTime();
}

/* 分类按钮：全部 + 数据里出现过的分类（去重，保持首次出现的顺序） */
function renderArchiveFilters() {
    const box = document.getElementById('archive-filters');
    if (!box) return;

    const categories = ['全部'];
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

    // 记住鼠标当前停在哪个作品上：悬停时按 Enter / 空格 直接进入
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
    if (e.isComposing) return; // 输入法正在组词时先交给输入法
    if (document.body.classList.contains('mode-gallery')) return;

    // 列表重绘过就丢弃旧节点，避免打开已不存在的作品
    const item = hoveredArchiveItem && document.contains(hoveredArchiveItem) ? hoveredArchiveItem : null;
    if (!item) return;

    e.preventDefault();
    handleArchiveOpen(item);
}

/* 排序用日期：取 copy.js 里的作品日期（如 "2026.10.16"） */
function getProjectSortDate(proj) {
    return getWorkCopy(proj).date;
}

function getVisibleProjects() {
    let list = WORKS_DATA.projects.filter(proj => {
        const matchCategory = archiveCategory === '全部' || proj.category === archiveCategory;
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

/* 搜索命中：把标题里匹配的一段包起来上色 */
function highlightArchiveTitle(title) {
    if (!archiveQuery) return title;
    const index = title.toLowerCase().indexOf(archiveQuery);
    if (index === -1) return title;
    const end = index + archiveQuery.length;
    return `${title.slice(0, index)}<mark class="ai-hit">${title.slice(index, end)}</mark>${title.slice(end)}`;
}

/* 日期拆成「年 / 月.日」两段，左侧竖排成日期戳 */
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
        // 点击交给统一函数：先给这一行一个短暂的“压实”反馈，再进厅
        const clickAttr = ready ? 'onclick="handleArchiveOpen(this)"' : '';
        // data-work 用于记录鼠标当前停在哪个作品上
        const workAttr = ready ? `data-work="${proj.id}"` : '';
        const lockedClass = ready ? '' : ' is-locked';
        // 未上架的作品降低透明度且不可点击
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

/* 打开某一条记录：停留 120ms 让这一行先显形，再交给整页淡变 */
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
