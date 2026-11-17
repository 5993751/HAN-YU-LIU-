/* =========================================================
   音频可视化流声机 (js/audio-viz.js)
   小尺寸黑胶唱片 + 真实频谱；只在播放时工作，暂停立即停帧
   ========================================================= */

const AUDIO_VIZ_BARS = 9;
const AUDIO_VIZ_WIDTH = 34;
const AUDIO_VIZ_HEIGHT = 14;

let audioCtx = null;
let audioAnalyser = null;
let audioData = null;
let audioVizCanvas = null;
let audioVizPaint = null;
let audioVizFrame = 0;
let audioVizRetry = 0;

function initAudioViz() {
    audioVizCanvas = document.getElementById('audioViz');
    if (!audioVizCanvas) return;

    const dpr = window.devicePixelRatio || 1;
    audioVizCanvas.width = AUDIO_VIZ_WIDTH * dpr;
    audioVizCanvas.height = AUDIO_VIZ_HEIGHT * dpr;
    audioVizPaint = audioVizCanvas.getContext('2d');
    audioVizPaint.scale(dpr, dpr);

    drawAudioVizIdle();
}

/* 首次播放时才接管音频节点，避免一进页面就创建 AudioContext */
function attachAudioAnalyser() {
    if (audioAnalyser) return true;

    // 直接双击 index.html（file://）打开时，媒体源会被浏览器当成跨域资源，
    // 一旦接入 Web Audio 就只剩静音——所以这种情况下不接管，让声音走原生输出
    if (location.protocol === 'file:') return false;

    const audio = document.getElementById('masterAudio');
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!audio || !AudioCtx) return false;

    if (!audioCtx) audioCtx = new AudioCtx();

    // 上下文还在挂起时接管会把声音掐断：先让它恢复，等真正 running 了再接管
    if (audioCtx.state !== 'running') {
        audioCtx.resume();
        return false;
    }

    try {
        const source = audioCtx.createMediaElementSource(audio);
        audioAnalyser = audioCtx.createAnalyser();
        audioAnalyser.fftSize = 64;
        audioAnalyser.smoothingTimeConstant = 0.82;
        source.connect(audioAnalyser);
        audioAnalyser.connect(audioCtx.destination);
        audioData = new Uint8Array(audioAnalyser.frequencyBinCount);
        return true;
    } catch (e) {
        audioAnalyser = null;
        return false;
    }
}

/* 接管还没成功时，过一会儿再试；只在确实在播放时才重试 */
function retryAttachAudioAnalyser() {
    if (audioVizRetry) return;
    audioVizRetry = window.setTimeout(() => {
        audioVizRetry = 0;
        const audio = document.getElementById('masterAudio');
        if (audio && !audio.paused) startAudioViz();
    }, 180);
}

/* 在用户点击的那一刻唤醒 AudioContext，浏览器才允许它出声 */
function primeAudioContext() {
    if (location.protocol === 'file:' || audioAnalyser) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!audioCtx) audioCtx = new AudioCtx();
    if (audioCtx.state !== 'running') audioCtx.resume();
}

function startAudioViz() {
    if (!audioVizPaint) return;
    if (!attachAudioAnalyser()) {
        retryAttachAudioAnalyser();
        return;
    }
    // 已经接管过的上下文可能又被系统挂起，播放时顺手唤醒
    if (audioCtx && audioCtx.state !== 'running') audioCtx.resume();
    if (audioVizFrame) return;
    drawAudioVizFrame();
}

function stopAudioViz() {
    if (audioVizRetry) {
        window.clearTimeout(audioVizRetry);
        audioVizRetry = 0;
    }
    if (audioVizFrame) {
        cancelAnimationFrame(audioVizFrame);
        audioVizFrame = 0;
    }
    drawAudioVizIdle();
}

function drawAudioVizIdle() {
    if (!audioVizPaint) return;
    audioVizPaint.clearRect(0, 0, AUDIO_VIZ_WIDTH, AUDIO_VIZ_HEIGHT);
    audioVizPaint.fillStyle = audioVizPalette().idle;
    for (let i = 0; i < AUDIO_VIZ_BARS; i++) {
        audioVizPaint.fillRect(i * 4, 11, 2, 2);
    }
}

/* 深浅章节切换时，频谱和唱片要跟着换色，否则暗底上会看不见 */
function audioVizPalette() {
    if (document.body.classList.contains('dark-chapter')) {
        return { bar: 'rgba(230, 223, 211, 0.78)', peak: 'rgba(212, 175, 106, 0.95)', idle: 'rgba(230, 223, 211, 0.30)' };
    }
    return { bar: 'rgba(38, 34, 29, 0.72)', peak: 'rgba(193, 154, 91, 0.95)', idle: 'rgba(38, 34, 29, 0.26)' };
}

/* 暂停状态下换章时重绘静止基线；播放中不用管，每帧都会重新取色 */
function refreshAudioVizIdle() {
    if (!audioVizFrame) drawAudioVizIdle();
}

function drawAudioVizFrame() {
    audioVizFrame = requestAnimationFrame(drawAudioVizFrame);
    audioAnalyser.getByteFrequencyData(audioData);

    const palette = audioVizPalette();
    audioVizPaint.clearRect(0, 0, AUDIO_VIZ_WIDTH, AUDIO_VIZ_HEIGHT);
    for (let i = 0; i < AUDIO_VIZ_BARS; i++) {
        // 取低频段（跳过最前面两格），人声与器乐的能量主要落在这里
        const value = audioData[i + 2] / 255;
        const barHeight = Math.max(2, value * 12);
        audioVizPaint.fillStyle = value > 0.72 ? palette.peak : palette.bar;
        audioVizPaint.fillRect(i * 4, 13 - barHeight, 2, barHeight);
    }
}
