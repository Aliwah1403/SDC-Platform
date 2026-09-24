const HEALTHCARE = /(^|\.)(healthcare|hospital|clinic|pharmacy|doctor|medical|dentist|laboratory|emergency)(\.|$)/i;

function normalize(value) {
  return String(value || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim();
}

function similarity(a, b) {
  const left = normalize(a); const right = normalize(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  const aWords = new Set(left.split(' ')); const bWords = new Set(right.split(' '));
  const overlap = [...aWords].filter((word) => bWords.has(word)).length;
  return overlap / new Set([...aWords, ...bWords]).size;
}

export function distanceMeters(aLat, aLng, bLat, bLng) {
  if (![aLat, aLng, bLat, bLng].every(Number.isFinite)) return null;
  const rad = Math.PI / 180; const dLat = (bLat - aLat) * rad; const dLng = (bLng - aLng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function scoreFacilityCandidate(parsed, candidate) {
  const distance = distanceMeters(parsed.lat, parsed.lng, candidate.lat, candidate.lng);
  const name = similarity(parsed.name, candidate.name);
  const address = similarity(parsed.address, candidate.address);
  const category = (candidate.categories || []).some((value) => HEALTHCARE.test(value)) ? 1 : 0;
  const tooFar = distance !== null && distance > 1500;
  const countryConflict = !!parsed.countryCode && !!candidate.countryCode && parsed.countryCode !== candidate.countryCode;
  const hardConflict = tooFar || countryConflict || (candidate.categories?.length > 0 && category === 0) || (name < 0.15 && parsed.name && candidate.name);
  const distanceScore = distance === null ? 0 : Math.max(0, 1 - distance / 1500);
  const score = distance === null
    ? name * 0.6 + category * 0.25 + address * 0.15
    : distanceScore * 0.5 + name * 0.25 + category * 0.2 + address * 0.05;
  return {
    candidate,
    distanceMeters: distance,
    score: Math.max(0, Math.min(1, score)),
    hardConflict,
    reasons: [
      distance === null ? 'no_coordinate_match' : `distance_${Math.round(distance)}m`,
      parsed.name ? (name >= 0.5 ? 'name_match' : 'name_uncertain') : 'name_unavailable',
      parsed.address ? (address >= 0.4 ? 'address_match' : 'address_uncertain') : 'address_unavailable',
      category ? 'healthcare_category' : 'category_uncertain',
      ...(countryConflict ? ['country_conflict'] : []),
    ],
  };
}

export function chooseFacilityCandidate(parsed, candidates) {
  const ranked = (candidates || []).map((candidate) => scoreFacilityCandidate(parsed, candidate)).sort((a, b) => b.score - a.score);
  const best = ranked[0]; const second = ranked[1];
  if (!best || best.hardConflict || best.score < 0.65) return { decision: 'manual', ranked, selected: null };
  if (best.score >= 0.85 && (!second || best.score - second.score >= 0.15)) return { decision: 'strong_candidate', ranked, selected: best };
  return { decision: 'review', ranked, selected: best };
}
