/* 音频可视化流声机频谱渲染 */

const AUDIO_VIZ_BARS = 9;
const AUDIO_VIZ_WIDTH = 34;
const AUDIO_VIZ_HEIGHT = 14;
const AUDIO_VIZ_MAX_RETRIES = 15;

let audioCtx = null;
let audioAnalyser = null;
let audioData = null;
let audioVizCanvas = null;
let audioVizPaint = null;
let audioVizFrame = 0;
let audioVizRetry = 0;
let audioVizRetryCount = 0;

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

function attachAudioAnalyser() {
    if (audioAnalyser) return true;

    // file:// 下媒体源会被浏览器判定为跨域，接入 Web Audio 会静音，此处保持原生输出
    if (location.protocol === 'file:') return false;

    const audio = document.getElementById('masterAudio');
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!audio || !AudioCtx) return false;

    if (!audioCtx) audioCtx = new AudioCtx();

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

function retryAttachAudioAnalyser() {
    if (audioVizRetry || audioVizRetryCount >= AUDIO_VIZ_MAX_RETRIES) return;
    audioVizRetryCount++;
    audioVizRetry = window.setTimeout(() => {
        audioVizRetry = 0;
        const audio = document.getElementById('masterAudio');
        if (audio && !audio.paused) startAudioViz();
    }, 180);
}

function primeAudioContext() {
    if (location.protocol === 'file:' || audioAnalyser) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!audioCtx) audioCtx = new AudioCtx();
    if (audioCtx.state !== 'running') audioCtx.resume();
}

function startAudioViz() {
    if (!audioVizPaint || location.protocol === 'file:') return;
    if (!attachAudioAnalyser()) {
        retryAttachAudioAnalyser();
        return;
    }
    audioVizRetryCount = 0;
    if (audioCtx && audioCtx.state !== 'running') audioCtx.resume();
    if (audioVizFrame) return;
    drawAudioVizFrame();
}

function stopAudioViz() {
    if (audioVizRetry) {
        window.clearTimeout(audioVizRetry);
        audioVizRetry = 0;
    }
    audioVizRetryCount = 0;
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

function audioVizPalette() {
    if (document.body.classList.contains('dark-chapter')) {
        return { bar: 'rgba(230, 223, 211, 0.78)', peak: 'rgba(212, 175, 106, 0.95)', idle: 'rgba(230, 223, 211, 0.30)' };
    }
    return { bar: 'rgba(38, 34, 29, 0.72)', peak: 'rgba(193, 154, 91, 0.95)', idle: 'rgba(38, 34, 29, 0.26)' };
}

function refreshAudioVizIdle() {
    if (!audioVizFrame) drawAudioVizIdle();
}

function drawAudioVizFrame() {
    audioVizFrame = requestAnimationFrame(drawAudioVizFrame);
    audioAnalyser.getByteFrequencyData(audioData);

    const palette = audioVizPalette();
    audioVizPaint.clearRect(0, 0, AUDIO_VIZ_WIDTH, AUDIO_VIZ_HEIGHT);
    for (let i = 0; i < AUDIO_VIZ_BARS; i++) {
        const value = audioData[i + 2] / 255;
        const barHeight = Math.max(2, value * 12);
        audioVizPaint.fillStyle = value > 0.72 ? palette.peak : palette.bar;
        audioVizPaint.fillRect(i * 4, 13 - barHeight, 2, barHeight);
    }
}
