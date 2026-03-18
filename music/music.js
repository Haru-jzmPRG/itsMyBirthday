// music/music.js
import { PLAYLIST } from "./playlist.js";
import { setGameState, onGameStateChange } from "../js/firebase.js";
import { watchPlayerList, givePoints, resetGame } from "../js/scores.js";

const GAME_ID = "music";

// ── Playlist ───────────────────────────────────────────────

export function getRandomTrack(exclude = []) {
    const available = PLAYLIST.filter(t => !exclude.includes(t.id));
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
}

// ── YouTube IFrame API ─────────────────────────────────────

let player = null;
let playerReady = false;
let stopTimer = null;
let pendingPlay = null; // guarda lo que hay que hacer tras el anuncio

export function initYouTubePlayer(containerId, onReady) {
    if (!window.YT) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
    }

    window.onYouTubeIframeAPIReady = () => {
        player = new YT.Player(containerId, {
            height: "1",
            width: "1",
            playerVars: {
                autoplay: 0,
                controls: 0,
                disablekb: 1,
                fs: 0,
                modestbranding: 1,
                rel: 0,
            },
            events: {
                onReady: () => {
                    playerReady = true;
                    if (onReady) onReady();
                },
                onStateChange: (event) => {
                    handleStateChange(event.data);
                },
            },
        });
    };

    if (window.YT && window.YT.Player) {
        window.onYouTubeIframeAPIReady();
    }
}

function handleStateChange(state) {
    // -1 = sin iniciar, 0 = terminado, 1 = reproduciendo, 2 = pausado
    // 3 = buffering, 5 = video en cola
    // El anuncio NO tiene un estado propio en la API pública,
    // pero sí podemos detectarlo porque el player reporta
    // "reproduciendo" pero getCurrentTime() devuelve 0 o negativo

    if (state === YT.PlayerState.PLAYING) {
        const time = player.getCurrentTime();

        if (time < 0 || (pendingPlay && time < 0.5)) {
            // Tiempo negativo = anuncio reproduciéndose
            // Esperamos y volvemos a chequear
            setTimeout(() => {
                const newTime = player.getCurrentTime();
                if (newTime < 0.5 && pendingPlay) {
                    // Sigue en anuncio, seguir esperando
                    waitForAdToEnd();
                } else if (pendingPlay) {
                    // Terminó el anuncio, arrancar timer
                    startStopTimer(pendingPlay.seconds, pendingPlay.onEnd);
                    pendingPlay = null;
                }
            }, 500);
        }
    }
}

function waitForAdToEnd() {
    // Polling cada 500ms hasta que getCurrentTime() > 0
    const check = setInterval(() => {
        if (!player || !pendingPlay) {
            clearInterval(check);
            return;
        }

        const time = player.getCurrentTime();
        const state = player.getPlayerState();

        if (state === YT.PlayerState.PLAYING && time >= 0.5) {
            // El anuncio terminó, la canción está sonando
            clearInterval(check);
            startStopTimer(pendingPlay.seconds, pendingPlay.onEnd);
            pendingPlay = null;
        }
    }, 500);
}

function startStopTimer(seconds, onEnd) {
    clearStopTimer();
    stopTimer = setTimeout(() => {
        pauseTrack();
        if (onEnd) onEnd();
    }, seconds * 1000);
}

// ── Reproducción ───────────────────────────────────────────

export function playTrack(videoId, seconds, onEnd) {
    if (!playerReady || !player) return;
    clearStopTimer();

    // Guardar qué hacer tras el anuncio
    pendingPlay = { seconds, onEnd };

    player.loadVideoById({ videoId, startSeconds: 0 });
    player.playVideo();

    // Chequeo inicial — si no hay anuncio arranca el timer directo
    setTimeout(() => {
        if (!pendingPlay) return; // ya se resolvió
        const time = player.getCurrentTime();
        const state = player.getPlayerState();

        if (state === YT.PlayerState.PLAYING && time >= 0.5) {
            // No hubo anuncio
            startStopTimer(seconds, onEnd);
            pendingPlay = null;
        } else {
            // Hay anuncio, esperar
            waitForAdToEnd();
        }
    }, 1000);
}

export function extendPlayback(extraSeconds, onEnd) {
    if (!playerReady || !player) return;
    clearStopTimer();

    player.playVideo();

    stopTimer = setTimeout(() => {
        pauseTrack();
        if (onEnd) onEnd();
    }, extraSeconds * 1000);
}

export function pauseTrack() {
    clearStopTimer();
    if (playerReady && player) player.pauseVideo();
}

export function resumeTrack(seconds, onEnd) {
    extendPlayback(seconds, onEnd);
}

export function stopTrack() {
    clearStopTimer();
    if (playerReady && player) player.stopVideo();
}

function clearStopTimer() {
    if (stopTimer) {
        clearTimeout(stopTimer);
        stopTimer = null;
    }
}

export function isPlaying() {
    if (!playerReady || !player) return false;
    return player.getPlayerState() === YT.PlayerState.PLAYING;
}

// ── Firebase sync ──────────────────────────────────────────

export async function broadcastTrack(track) {
    await setGameState(GAME_ID, {
        status: "playing",
        trackTitle: track.title,
        artist: track.artist,
        videoId: track.id,
        revealedAt: null,
    });
}

export async function revealTrack(track) {
    await setGameState(GAME_ID, {
        status: "revealed",
        trackTitle: track.title,
        artist: track.artist,
        videoId: track.id,
        revealedAt: Date.now(),
    });
}

export async function setWaiting() {
    await setGameState(GAME_ID, { status: "waiting" });
}

export function watchGameState(callback) {
    onGameStateChange(GAME_ID, callback);
}

// ── Host panel ─────────────────────────────────────────────

export function initHostPanel(containerId) {
    watchPlayerList(GAME_ID, containerId, async (playerName, points) => {
        await givePoints(GAME_ID, playerName, points);
    });
}

export async function resetRound() {
    await resetGame(GAME_ID);
}