// Turns the server's stats object into plain-English text for the UI
export const STATUS_LABEL = {
  'no-data': 'No data yet',
  safe: 'Safe',
  warning: 'Close to the limit',
  danger: 'Below the limit',
};

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 'es'}`;

export function describeStats(s) {
  if (s.status === 'no-data') return 'No classes marked yet';
  if (s.status === 'danger') {
    if (s.mustAttend === null) return `${s.threshold}% can no longer be reached`;
    return `Attend the next ${plural(s.mustAttend, 'class')} in a row to reach ${s.threshold}%`;
  }
  if (s.canMiss === null) return 'No minimum attendance set';
  if (s.canMiss === 0) return "You're right at the limit. Don't miss the next class";
  return `You can miss ${plural(s.canMiss, 'class')} and stay above ${s.threshold}%`;
}

export function formatPercentage(p) {
  return p === null || p === undefined ? '–' : `${Number.isInteger(p) ? p : p.toFixed(1)}%`;
}
