// music/music.js
import { YOUTUBE_API_KEY, YOUTUBE_PLAYLIST_ID } from "../config.js";
import { setGameState, onGameStateChange } from "../js/firebase.js";
import { watchPlayerList, givePoints, resetGame } from "../js/scores.js";

const GAME_ID = "music";

// ── Cargar playlist de YouTube ─────────────────────────────

export async function loadPlaylist() {
    let tracks    = [];
    let pageToken = "";

    do {
        const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
        url.searchParams.set("part",       "snippet");
        url.searchParams.set("playlistId", YOUTUBE_PLAYLIST_ID);
        url.searchParams.set("maxResults", "50");
        url.searchParams.set("key",        YOUTUBE_API_KEY);
        if (pageToken) url.searchParams.set("pageToken", pageToken);

        const res  = await fetch(url);
        const data = await res.json();

        if (data.error) {
            console.error("Error cargando playlist:", data.error.message);
            break;
        }

        const valid = data.items
            .filter(item =>
                item.snippet.resourceId.kind === "youtube#video" &&
                item.snippet.title !== "Private video" &&
                item.snippet.title !== "Deleted video"
            )
            .map(item => ({
                id:     item.snippet.resourceId.videoId,
                title:  item.snippet.title,
                artist: item.snippet.videoOwnerChannelTitle || "",
                cover:  item.snippet.thumbnails?.medium?.url || "",
            }));

        tracks    = [...tracks, ...valid];
        pageToken = data.nextPageToken || "";

    } while (pageToken);

    return tracks;
}

export function getRandomTrack(tracks, exclude = []) {
    const available = tracks.filter(t => !exclude.includes(t.id));
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