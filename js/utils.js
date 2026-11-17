/* =========================================================
   公共工具函数 (js/utils.js)
   被 home / music / gallery 等模块复用的小函数
   ========================================================= */

function normalizeSrc(src) {
    if (!src) return "";
    const a = document.createElement('a');
    a.href = src;
    return a.href;
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el && text !== undefined) el.textContent = text;
}

/* 作品是否已上架：没写 isReady 字段的作品默认视为已上架 */
function isProjectReady(project) {
    return !!project && project.isReady !== false;
}

/* ⭐ 图片懒加载：翻到第 index 页时，才装载该页与相邻 ±1 页的图片。
   图片网址先存在 data-src 上（浏览器不下载），
   调用本函数才装回 src 触发下载——浏览到才下载，远处的不占流量。 */
function lazyLoadSlideImages(containerEl, index) {
    if (!containerEl) return;

    const loadOne = (i) => {
        const img = containerEl.querySelector(`[data-index="${i}"] img[data-src]`);
        if (img && img.dataset.src) {
            // 图片真正解码完成后再打 developed，显影动画一定看得见（样式在 css/effects.css）
            const reveal = () => img.classList.add('developed');
            if (img.complete && img.naturalWidth) {
                reveal();
            } else {
                img.addEventListener('load', reveal, { once: true });
            }
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        }
    };

    loadOne(index);        // 当前页立即装载
    loadOne(index - 1);    // 预载相邻页，保证翻页瞬间出图
    loadOne(index + 1);
}

/* =========================================================
   章节色温过渡用：把基色按色相偏移一点，得到同色系的第二种色
   返回 hsla(...) 字符串，只用于极淡的漂移薄雾，不直接当背景色
   ========================================================= */
function shiftHueWash(hex, hueShift, lightShift, alpha) {
    const v = hex.replace('#', '');
    const full = v.length === 3 ? v.split('').map(c => c + c).join('') : v;
    const r = parseInt(full.slice(0, 2), 16) / 255;
    const g = parseInt(full.slice(2, 4), 16) / 255;
    const b = parseInt(full.slice(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const light = (max + min) / 2;
    const delta = max - min;

    let hue = 0;
    let sat = 0;
    if (delta !== 0) {
        sat = delta / (1 - Math.abs(2 * light - 1));
        if (max === r) hue = ((g - b) / delta) % 6;
        else if (max === g) hue = (b - r) / delta + 2;
        else hue = (r - g) / delta + 4;
        hue *= 60;
    }

    hue = (hue + hueShift + 360) % 360;
    const light2 = Math.min(96, Math.max(4, light * 100 + lightShift));
    return `hsla(${hue.toFixed(0)}, ${(sat * 100).toFixed(0)}%, ${light2.toFixed(0)}%, ${alpha})`;
}

/* 作品对外文案统一入口：名字、日期、一句介绍都写在 data/copy.js，按作品 id 取 */
function getWorkCopy(project) {
    const entry = (typeof WORK_COPY !== 'undefined' && project && WORK_COPY[project.id]) || {};
    return {
        title: entry.title || '',
        date: entry.date || '',
        intro: entry.intro || ''
    };
}