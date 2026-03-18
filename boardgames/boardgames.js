// boardgames/boardgames.js

import { db, ref } from "../js/firebase.js";
import {
    set, get, update, onValue, push
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ── Estructura en Firebase ─────────────────────────────────
// boardgames/
//   players/
//     {name}/
//       totalScore: 100
//       games/
//         {gameId}: 40
//         {gameId}: 60

// ── Cargar jugadores del lobby ─────────────────────────────

export async function syncPlayersFromLobby() {
    const lobbySnap = await get(ref(db, "games/lobby/players"));
    if (!lobbySnap.exists()) return;

    const lobbyPlayers = lobbySnap.val();
    const boardSnap = await get(ref(db, "boardgames/players"));
    const boardPlayers = boardSnap.exists() ? boardSnap.val() : {};

    const updates = {};
    Object.keys(lobbyPlayers).forEach(name => {
        if (!boardPlayers[name]) {
            updates[`boardgames/players/${name}`] = {
                totalScore: 0,
                games: {},
            };
        }
    });

    if (Object.keys(updates).length > 0) {
        await update(ref(db), updates);
    }
}

// ── Dar puntos a un jugador en un juego específico ─────────

export async function addBoardPoints(playerName, gameId, points) {
    if (points === 0) return;

    const playerRef = ref(db, `boardgames/players/${playerName}`);
    const snapshot = await get(playerRef);
    if (!snapshot.exists()) return;

    const data = snapshot.val();
    const prevTotal = data.totalScore || 0;
    const prevGame = data.games?.[gameId] || 0;

    await update(playerRef, {
        totalScore: prevTotal + points,
        [`games/${gameId}`]: prevGame + points,
    });
}

// ── Escuchar jugadores en tiempo real ──────────────────────

export function watchBoardPlayers(callback) {
    onValue(ref(db, "boardgames/players"), (snapshot) => {
        if (!snapshot.exists()) { callback([]); return; }
        const players = [];
        snapshot.forEach(child => {
            players.push({ name: child.key, ...child.val() });
        });
        players.sort((a, b) => b.totalScore - a.totalScore);
        callback(players);
    });
}

// ── Reset total ────────────────────────────────────────────

export async function resetBoardScores() {
    const snapshot = await get(ref(db, "boardgames/players"));
    if (!snapshot.exists()) return;

    const updates = {};
    snapshot.forEach(child => {
        updates[`boardgames/players/${child.key}/totalScore`] = 0;
        updates[`boardgames/players/${child.key}/games`] = {};
    });
    await update(ref(db), updates);
}

// ── Reset de un juego específico ───────────────────────────

export async function resetGameScore(gameId) {
    const snapshot = await get(ref(db, "boardgames/players"));
    if (!snapshot.exists()) return;

    const updates = {};
    snapshot.forEach(child => {
        const data = child.val();
        const gameScore = data.games?.[gameId] || 0;
        const newTotal = Math.max(0, (data.totalScore || 0) - gameScore);
        updates[`boardgames/players/${child.key}/totalScore`] = newTotal;
        updates[`boardgames/players/${child.key}/games/${gameId}`] = 0;
    });
    await update(ref(db), updates);
}