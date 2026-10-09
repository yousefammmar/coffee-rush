import { ACHIEVEMENTS } from '../data/achievements.js';

/** Returns achievements newly unlocked by the current save state. */
export function evaluateAchievements(data) {
  const fresh = [];
  for (const a of ACHIEVEMENTS) {
    if (!data.achievements[a.id] && a.check(data)) { data.achievements[a.id] = Date.now(); fresh.push(a); }
  }
  return fresh;
}

/** Records the outcome of one customer into the lifetime stats. outcome = tier | 'missed'. */
export function recordOutcome(stats, outcome) {
  if (outcome === 'missed') stats.missed += 1;
  else { stats.served += outcome === 'incorrect' ? 0 : 1; stats[outcome] += 1; }
  const ok = outcome !== 'missed' && outcome !== 'incorrect';
  stats.streak = ok ? stats.streak + 1 : 0;
  stats.bestStreak = Math.max(stats.bestStreak, stats.streak);
}
