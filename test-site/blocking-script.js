/**
 * Blocking Script
 * This script is intentionally loaded synchronously in the head
 * to demonstrate render-blocking behavior
 */

// Simulate some blocking work
console.log('Blocking script loaded');

// This would block rendering in a real scenario
// const start = Date.now();
// while (Date.now() - start < 100) {
//   // Busy wait
// }
