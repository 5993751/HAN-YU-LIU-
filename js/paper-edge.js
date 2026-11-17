/* =========================================================
   纸边随机化 (js/paper-edge.js)
   每次进入页面重新掷一次噪声种子，撕口形状会换一种，
   但位移幅度限制在固定区间内，尺寸与观感不变。
   ========================================================= */

(function () {
    const EDGE_TUNING = [
        // 长纸条：撕口幅度稍大，边缘更明显
        { filterId: 'paper-rough', scale: [18, 26], frequency: [0.016, 0.021] },
        // 便签：颗粒更细碎
        { filterId: 'paper-rough-soft', scale: [8, 13], frequency: [0.026, 0.034] }
    ];

    function randomBetween(min, max) {
        return min + Math.random() * (max - min);
    }

    window.randomizePaperEdges = function () {
        EDGE_TUNING.forEach(({ filterId, scale, frequency }) => {
            const filter = document.getElementById(filterId);
            if (!filter) return;

            const noise = filter.querySelector('feTurbulence');
            const displace = filter.querySelector('feDisplacementMap');

            if (noise) {
                noise.setAttribute('seed', String(Math.floor(randomBetween(1, 999))));
                noise.setAttribute('baseFrequency', randomBetween(frequency[0], frequency[1]).toFixed(4));
            }
            if (displace) {
                displace.setAttribute('scale', String(Math.round(randomBetween(scale[0], scale[1]))));
            }
        });
    };
})();
