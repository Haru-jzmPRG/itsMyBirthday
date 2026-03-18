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

export function initYouTubePlayer(containerId, onReady) {
    // Cargar el script de YouTube si no está
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
            },
        });
    };

    // Si YT ya estaba cargado, inicializar directamente
    if (window.YT && window.YT.Player) {
        window.onYouTubeIframeAPIReady();
    }
}

// ── Reproducción ───────────────────────────────────────────

export function playTrack(videoId, seconds, onEnd) {
    if (!playerReady || !player) return;
    clearStopTimer();

    player.loadVideoById({ videoId, startSeconds: 0 });
    player.playVideo();

    stopTimer = setTimeout(() => {
        pauseTrack();
        if (onEnd) onEnd();
    }, seconds * 1000);
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