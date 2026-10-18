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

/* ⭐ 图片懒加载：翻到第 index 页时，才装载该页与相邻 ±1 页的图片。
   图片网址先存在 data-src 上（浏览器不下载），
   调用本函数才装回 src 触发下载——浏览到才下载，远处的不占流量。 */
function lazyLoadSlideImages(containerEl, index) {
    if (!containerEl) return;

    const loadOne = (i) => {
        const img = containerEl.querySelector(`[data-index="${i}"] img[data-src]`);
        if (img && img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        }
    };

    loadOne(index);        // 当前页立即装载
    loadOne(index - 1);    // 预载相邻页，保证翻页瞬间出图
    loadOne(index + 1);
}