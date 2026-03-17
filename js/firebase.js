// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, get, onValue, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { FIREBASE_URL } from "../config.js";

const firebaseConfig = {
  databaseURL: FIREBASE_URL
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ── Jugadores ──────────────────────────────────────────────

export async function addPlayer(gameId, playerName) {
  const playerRef = ref(db, `games/${gameId}/players/${playerName}`);
  await set(playerRef, { name: playerName, score: 0 });
}

export async function getPlayers(gameId) {
  const snapshot = await get(ref(db, `games/${gameId}/players`));
  return snapshot.exists() ? snapshot.val() : {};
}

export function onPlayersChange(gameId, callback) {
  onValue(ref(db, `games/${gameId}/players`), (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : {});
  });
}

// ── Puntajes ───────────────────────────────────────────────

export async function addPoints(gameId, playerName, points) {
  const playerRef = ref(db, `games/${gameId}/players/${playerName}`);
  const snapshot = await get(playerRef);
  if (snapshot.exists()) {
    const current = snapshot.val().score || 0;
    await update(playerRef, { score: current + points });
  }
}

export async function resetScores(gameId) {
  const players = await getPlayers(gameId);
  const updates = {};
  Object.keys(players).forEach(name => {
    updates[`games/${gameId}/players/${name}/score`] = 0;
  });
  await update(ref(db), updates);
}

// ── Estado del juego ───────────────────────────────────────

export async function setGameState(gameId, state) {
  await set(ref(db, `games/${gameId}/state`), state);
}

export function onGameStateChange(gameId, callback) {
  onValue(ref(db, `games/${gameId}/state`), (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });
}

export { db, ref };