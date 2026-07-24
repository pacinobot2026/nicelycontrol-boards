/**
 * Dedupe helpers for the article research queue.
 *
 * Kept free of network/database calls so the matching logic can be tested in
 * isolation. See scripts/research-articles.js for the caller.
 *
 * Why this exists: "Deduplication strategy" was the highest-priority unresolved
 * item in the old Alex/Manus coordination board. Without it, a recurring event
 * (a festival, a weekly market) gets re-queued every time research runs.
 */

// Words that carry no signal when comparing headlines about local news/events.
const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'from', 'has',
  'have', 'in', 'into', 'is', 'it', 'its', 'of', 'on', 'or', 'over', 'that',
  'the', 'their', 'this', 'to', 'was', 'were', 'will', 'with', 'you', 'your',
  // high-frequency filler in this domain specifically
  'county', 'area', 'local', 'new', 'news', 'event', 'events', 'coming', 'set',
  'returns', 'announces', 'celebrates', 'hosts',
]);

// Bias toward aggressive deduping: a wrongly-skipped story just means a human
// doesn't see one suggestion, while a missed duplicate means readers get the
// same story twice. The second failure is the visible one.
const DEFAULT_THRESHOLD = 0.5;

/**
 * Ordinals and spelled-out numbers collapse to a bare digit, so "Fourth of
 * July", "4th of July", and "July 4" all compare equal. Without this, the same
 * event written two ways reads as two different stories — which is precisely
 * the failure that puts a duplicate in front of readers.
 */
const NUMBER_FORMS = new Map(Object.entries({
  first: '1', '1st': '1',
  second: '2', '2nd': '2',
  third: '3', '3rd': '3',
  fourth: '4', '4th': '4',
  fifth: '5', '5th': '5',
  sixth: '6', '6th': '6',
  seventh: '7', '7th': '7',
  eighth: '8', '8th': '8',
  ninth: '9', '9th': '9',
  tenth: '10', '10th': '10',
  one: '1', two: '2', three: '3', four: '4', five: '5',
  six: '6', seven: '7', eight: '8', nine: '9', ten: '10',
}));

function normalizeToken(word) {
  return NUMBER_FORMS.get(word) || word;
}

/**
 * Lowercase, strip punctuation, drop stopwords, normalize number forms.
 * Returns an array of content words.
 */
function tokenize(text) {
  if (!text) return [];
  return String(text)
    .toLowerCase()
    .replace(/[‘’“”]/g, '') // smart quotes
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(normalizeToken)
    // keep short tokens only when they're normalized digits (e.g. "4")
    .filter((w) => (w.length > 2 || /^\d+$/.test(w)) && !STOPWORDS.has(w));
}

/**
 * Jaccard similarity (intersection / union) over content words. 0..1.
 */
function similarity(a, b) {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (setA.size === 0 || setB.size === 0) return 0;

  let shared = 0;
  for (const w of setA) if (setB.has(w)) shared += 1;

  const union = setA.size + setB.size - shared;
  return union === 0 ? 0 : shared / union;
}

/**
 * Build the comparable text for a candidate or an existing record. Candidates
 * carry both a working `title` and a written `headline`; Letterman newsletters
 * often have a null `title` and put the real headline in `subject`.
 */
function comparableText(record) {
  if (!record) return '';
  return [record.title, record.headline, record.subject]
    .filter(Boolean)
    .join(' ');
}

/**
 * Find the first existing record that looks like the same story as `candidate`.
 * Returns {record, score, reason} or null.
 *
 * Two records match if either:
 *   - their content-word sets overlap at or above `threshold`, or
 *   - one's content words are entirely contained in the other's (catches
 *     "Crystal River July 4th" vs "Crystal River July 4th Celebration Returns
 *     Downtown With Fireworks").
 */
function findDuplicate(candidate, existing, threshold = DEFAULT_THRESHOLD) {
  const scored = scoreAgainstAll(candidate, existing);

  let best = null;
  for (const entry of scored) {
    if (entry.score >= threshold || entry.contained) {
      const reason = entry.score >= threshold ? 'similarity' : 'containment';
      if (!best || entry.score > best.score) {
        best = { record: entry.record, score: entry.score, reason };
      }
    }
  }
  return best;
}

/**
 * Score a candidate against every existing record, without applying a
 * threshold. Exposed so callers can surface near-misses for human review —
 * a story that scores just under the line is exactly where this heuristic is
 * least trustworthy.
 */
function scoreAgainstAll(candidate, existing) {
  const candText = comparableText(candidate);
  const candTokens = new Set(tokenize(candText));
  if (candTokens.size === 0) return [];

  const results = [];

  for (const record of existing) {
    const recText = comparableText(record);
    const recTokens = new Set(tokenize(recText));
    if (recTokens.size === 0) continue;

    // Compare the whole blob, and also title-to-title. A story can carry very
    // different headline copy while naming the same event in the title, so take
    // whichever signal is strongest.
    const fullScore = similarity(candText, recText);
    const titleScore = similarity(
      candidate.title || candidate.headline,
      record.title || record.subject || record.headline,
    );
    const score = Math.max(fullScore, titleScore);

    const smaller = candTokens.size <= recTokens.size ? candTokens : recTokens;
    const larger = smaller === candTokens ? recTokens : candTokens;
    let contained = true;
    for (const w of smaller) {
      if (!larger.has(w)) { contained = false; break; }
    }

    results.push({ record, score, contained });
  }

  return results;
}

/**
 * Records that fell just short of the duplicate threshold. These are worth a
 * human glance before the queue is worked.
 */
function findNearMisses(candidate, existing, threshold = DEFAULT_THRESHOLD, margin = 0.15) {
  return scoreAgainstAll(candidate, existing)
    .filter((e) => !e.contained && e.score < threshold && e.score >= threshold - margin)
    .sort((a, b) => b.score - a.score);
}

/**
 * Partition candidates into those worth queueing and those already covered.
 * Candidates are also compared against each other, so a single research run
 * can't insert the same story twice.
 */
function partitionCandidates(candidates, existing, threshold = DEFAULT_THRESHOLD) {
  const fresh = [];
  const duplicates = [];
  const nearMisses = [];
  const seenThisRun = [];

  for (const candidate of candidates) {
    const priorMatch = findDuplicate(candidate, existing, threshold);
    if (priorMatch) {
      duplicates.push({ candidate, ...priorMatch, against: 'existing' });
      continue;
    }

    const runMatch = findDuplicate(candidate, seenThisRun, threshold);
    if (runMatch) {
      duplicates.push({ candidate, ...runMatch, against: 'this-run' });
      continue;
    }

    for (const nm of findNearMisses(candidate, existing, threshold)) {
      nearMisses.push({ candidate, ...nm });
    }

    fresh.push(candidate);
    seenThisRun.push(candidate);
  }

  return { fresh, duplicates, nearMisses };
}

module.exports = {
  DEFAULT_THRESHOLD,
  tokenize,
  similarity,
  comparableText,
  scoreAgainstAll,
  findDuplicate,
  findNearMisses,
  partitionCandidates,
};
