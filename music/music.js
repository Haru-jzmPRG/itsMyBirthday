// music/music.js
import { SPOTIFY_CLIENT_ID, REDIRECT_URI, PLAYLIST_ID } from "../config.js";
import { setGameState, onGameStateChange } from "../js/firebase.js";
import { watchPlayerList, givePoints, resetGame } from "../js/scores.js";

const GAME_ID = "music";

// ── Auth PKCE ──────────────────────────────────────────────

function generateCodeVerifier() {
    const array = new Uint8Array(64);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function generateCodeChallenge(verifier) {
    const data = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export async function loginWithSpotify() {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    localStorage.setItem("code_verifier", verifier);

    const params = new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        response_type: "code",
        redirect_uri: REDIRECT_URI,
        scope: "playlist-read-private playlist-read-collaborative",
        code_challenge_method: "S256",
        code_challenge: challenge,
    });

    window.location = `https://accounts.spotify.com/authorize?${params}`;
}

export async function handleCallback() {
    const code = new URLSearchParams(window.location.search).get("code");
    if (!code) return null;

    const verifier = localStorage.getItem("code_verifier");

    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: SPOTIFY_CLIENT_ID,
            grant_type: "authorization_code",
            code,
            redirect_uri: REDIRECT_URI,
            code_verifier: verifier,
        }),
    });

    const data = await response.json();
    if (data.access_token) {
        localStorage.setItem("spotify_token", data.access_token);
        // Limpiar URL
        window.history.replaceState({}, "", window.location.pathname);
        return data.access_token;
    }
    return null;
}

export function getToken() {
    return localStorage.getItem("spotify_token");
}

export function logout() {
    localStorage.removeItem("spotify_token");
    localStorage.removeItem("code_verifier");
}

// ── Playlist ───────────────────────────────────────────────

export async function loadPlaylist(token) {
    let tracks = [];
    let url = `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks?limit=100`;

    while (url) {
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.error) {
            console.error("Error cargando playlist:", data.error);
            return [];
        }

        const valid = data.items
            .filter(item => item.track && item.track.preview_url)
            .map(item => ({
                id: item.track.id,
                name: item.track.name,
                artist: item.track.artists.map(a => a.name).join(", "),
                preview: item.track.preview_url,
                cover: item.track.album.images[1]?.url || item.track.album.images[0]?.url,
            }));

        tracks = [...tracks, ...valid];
        url = data.next || null;
    }

    return tracks;
}

export function getRandomTrack(tracks, exclude = []) {
    const available = tracks.filter(t => !exclude.includes(t.id));
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
}

// ── Reproducción ───────────────────────────────────────────

let audio = null;
let fadeTimer = null;

export function playPreview(previewUrl, seconds, onEnd) {
    stopPreview();

    audio = new Audio(previewUrl);
    audio.volume = 1;
    audio.play();

    fadeTimer = setTimeout(() => {
        fadeOut(audio, 500, onEnd);
    }, seconds * 1000);
}

export function extendPlayback(extraSeconds, onEnd) {
    if (!audio || audio.paused) return;
    clearTimeout(fadeTimer);
    fadeTimer = setTimeout(() => {
        fadeOut(audio, 500, onEnd);
    }, extraSeconds * 1000);
}

export function stopPreview() {
    if (fadeTimer) clearTimeout(fadeTimer);
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio = null;
    }
}

function fadeOut(audioEl, duration, onEnd) {
    const steps = 20;
    const interval = duration / steps;
    const decrement = audioEl.volume / steps;

    const fade = setInterval(() => {
        if (audioEl.volume > decrement) {
            audioEl.volume -= decrement;
        } else {
            audioEl.volume = 0;
            audioEl.pause();
            clearInterval(fade);
            if (onEnd) onEnd();
        }
    }, interval);
}

// ── Sincronización Firebase (host → players) ───────────────

export async function broadcastTrack(track) {
    await setGameState(GAME_ID, {
        status: "playing",
        trackName: track.name,
        artist: track.artist,
        cover: track.cover,
        revealedAt: null,
    });
}

export async function revealTrack(track) {
    await setGameState(GAME_ID, {
        status: "revealed",
        trackName: track.name,
        artist: track.artist,
        cover: track.cover,
        revealedAt: Date.now(),
    });
}

export async function setWaiting() {
    await setGameState(GAME_ID, { status: "waiting" });
}

export function watchGameState(callback) {
    onGameStateChange(GAME_ID, callback);
}

// ── Host: inicializar panel de jugadores ───────────────────

export function initHostPanel(containerId) {
    watchPlayerList(GAME_ID, containerId, async (playerName, points) => {
        await givePoints(GAME_ID, playerName, points);
    });
}

export async function resetRound() {
    await resetGame(GAME_ID);
}