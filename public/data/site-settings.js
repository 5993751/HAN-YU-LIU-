/* 全站运行参数与作品注册表 */

const SITE_SETTINGS = {
    homeSlideInterval: 5500,
    breezeBackgrounds: [
        "assets/breeze/bg-1.mp4"
    ],
    breezeFilePrefix: "assets/breeze/bg-",
    breezeFileExt: ".mp4",
    breezeMaxFiles: 12,
    breezeSwitchMinutes: 5,
    breezeSlowFactor: 1.0
};

const WORKS_DATA = {
    projects: []
};

function registerWork(work) {
    if (work) WORKS_DATA.projects.push(work);
}
