/**
 * confetti.js
 * Spawns animated confetti particles using the Web Animations API.
 * No CSS keyframes needed — animation is handled entirely in JS.
 */

const COLORS = ['#fdbf0f', '#08c4b4', '#00a89c', '#4caf50', '#ff5252', '#ffffff'];
const CLEANUP_DELAY_MS = 1300;

/**
 * @param {HTMLElement} container - Element to append particles into
 * @param {number} x - Horizontal origin (px, relative to container)
 * @param {number} y - Vertical origin (px, relative to container)
 * @param {number} count - Number of particles to spawn
 */
export function spawnConfetti(container, x, y, count = 18) {
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.classList.add('confetti-piece');
    piece.style.left            = `${x}px`;
    piece.style.top             = `${y}px`;
    piece.style.backgroundColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    piece.style.width           = `${6 + Math.random() * 8}px`;
    piece.style.height          = `${6 + Math.random() * 8}px`;
    piece.style.borderRadius    = Math.random() > 0.5 ? '50%' : '2px';

    const angle    = Math.random() * Math.PI * 2;
    const dist     = 40 + Math.random() * 80;
    const endX     = Math.cos(angle) * dist;
    const endY     = Math.sin(angle) * dist + 60;
    const rotation = 360 + Math.random() * 360;

    piece.animate(
      [
        { transform: 'translate(0,0) rotate(0deg)',                         opacity: 1 },
        { transform: `translate(${endX}px, ${endY}px) rotate(${rotation}deg)`, opacity: 0 },
      ],
      { duration: 700 + Math.random() * 500, easing: 'ease-out', fill: 'forwards' }
    );

    container.appendChild(piece);
    setTimeout(() => piece.remove(), CLEANUP_DELAY_MS);
  }
}
