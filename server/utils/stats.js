/**
 * Pure attendance maths. No database, no Express, so it is easy to test
 * and can be reused for teacher-marked records in phase 2.
 *
 * Holidays and cancelled classes are NOT passed in: they are excluded from
 * the percentage entirely. Only present and absent count.
 *
 * threshold is a whole-number percentage (e.g. 50 or 75).
 * All comparisons use integer arithmetic to avoid floating point surprises.
 */
function computeStats({ present = 0, absent = 0, threshold = 50 }) {
  const total = present + absent;
  const T = threshold;

  // Nothing marked yet
  if (total === 0) {
    return {
      present,
      absent,
      total,
      percentage: null,
      threshold: T,
      status: 'no-data',
      canMiss: null,
      mustAttend: 0,
    };
  }

  const percentage = Math.round((present / total) * 10000) / 100; // 2 decimals
  const above = present * 100 >= T * total;

  // Largest m such that present / (total + m) still >= T%
  let canMiss = 0;
  if (above && T > 0) {
    canMiss = Math.floor((present * 100 - T * total) / T);
  } else if (above && T === 0) {
    canMiss = null; // no limit
  }

  // Smallest x such that (present + x) / (total + x) >= T%
  let mustAttend = 0;
  if (!above) {
    mustAttend = T >= 100 ? null : Math.ceil((T * total - present * 100) / (100 - T));
  }

  let status = 'safe';
  if (!above) status = 'danger';
  else if (canMiss !== null && canMiss <= 1) status = 'warning';

  return { present, absent, total, percentage, threshold: T, status, canMiss, mustAttend };
}

module.exports = { computeStats };
