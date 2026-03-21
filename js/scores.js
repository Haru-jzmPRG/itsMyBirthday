// js/scores.js
import {
  addPlayer,
  getPlayers,
  onPlayersChange,
  addPoints,
  resetScores
} from "./firebase.js";

// ── Unirse a una partida ───────────────────────────────────

export async function joinGame(gameId, playerName) {
  const players = await getPlayers(gameId);
  if (players[playerName]) {
    console.log(`${playerName} ya está en la partida`);
    return false;
  }
  await addPlayer(gameId, playerName);
  return true;
}

// ── Verificar si un jugador existe en Firebase ─────────────

export async function playerExists(gameId, playerName) {
  const players = await getPlayers(gameId);
  return !!players[playerName];
}

export async function givePoints(gameId, playerName, points) {
  if (points === 0) return;
  await addPoints(gameId, playerName, points);
}

// ── Obtener ranking ordenado ───────────────────────────────

export function getSortedRanking(players) {
  return Object.values(players).sort((a, b) => b.score - a.score);
}

// ── Renderizar tabla de puntajes ───────────────────────────

export function renderScoreboard(players, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const ranking = getSortedRanking(players);

  container.innerHTML = ranking.map((player, index) => {
    const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`;
    return `
      <div class="score-row">
        <span class="score-rank">${medal}</span>
        <span class="score-name">${player.name}</span>
        <span class="score-points">${player.score} pts</span>
      </div>
    `;
  }).join("");
}

// ── Escuchar cambios y re-renderizar automáticamente ───────

export function watchScoreboard(gameId, containerId) {
  onPlayersChange(gameId, (players) => {
    renderScoreboard(players, containerId);
  });
}

// ── Renderizar lista de jugadores con botones (host) ───────

export function renderPlayerList(players, containerId, onGivePoints) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const ranking = getSortedRanking(players);

  container.innerHTML = ranking.map((player) => `
    <div class="player-row" id="player-${player.name}">
      <span class="player-name">${player.name}</span>
      <span class="player-score">${player.score} pts</span>
      <div class="point-buttons">
        <button class="btn-minus" onclick="onGivePoints('${player.name}', -1)">-1</button>
        <button onclick="onGivePoints('${player.name}', 1)">+1</button>
        <button onclick="onGivePoints('${player.name}', 2)">+2</button>
        <button onclick="onGivePoints('${player.name}', 3)">+3</button>
      </div>
    </div>
  `).join("");

  // Exponer la función al scope global para los onclick
  window.onGivePoints = onGivePoints;
}

// ── Escuchar cambios y re-renderizar lista (host) ──────────

export function watchPlayerList(gameId, containerId, onGivePoints) {
  onPlayersChange(gameId, (players) => {
    renderPlayerList(players, containerId, onGivePoints);
  });
}

// ── Reset ──────────────────────────────────────────────────

export async function resetGame(gameId) {
  await resetScores(gameId);
}