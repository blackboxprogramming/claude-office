/**
 * AI Cliche Phrase Detector
 * Detects common AI-generated cliche phrases organized by severity tier.
 * Used to trigger drinking game animations in the office visualization.
 */

// Severe tier patterns (~14)
const SEVERE_PATTERNS = [
  /\bdelve(?:s|d)?\s+into\b/i,
  /\byou'?re absolutely right\b/i,
  /\brich tapestry\b/i,
  /\bnavigate the complexities\b/i,
  /\bmultifaceted\b/i,
  /\bunlock(?:ing)?\s+(?:the\s+)?potential\b/i,
  /\bit'?s worth noting\b/i,
  /\bemerged as a game[- ]changer\b/i,
  /\blet'?s dive deep\b/i,
  /\brevolutionize the way\b/i,
  /\bever[- ]evolving landscape\b/i,
  /\bembark on a journey\b/i,
  /\bserves as a cornerstone\b/i,
  /\bharness the power\b/i,
];

// Medium tier patterns (~16)
const MEDIUM_PATTERNS = [
  /\b(?:furthermore|moreover)\b/i,
  /\brobust solution\b/i,
  /\bseamless(?:ly)?\s+integrat(?:ion|e|ed|ing)\b/i,
  /\bcutting[- ]edge\b/i,
  /\bfoster(?:ing|s)?\s+collaboration\b/i,
  /\bleverage(?:s|d)?\s+(?:the\s+)?technology\b/i,
  /\bgreat question!\b/i,
  /\bI'?d be happy to help\b/i,
  /\bat its core\b/i,
  /\bplays? a crucial role\b/i,
  /\bgroundbreaking\b/i,
  /\bbridging the gap\b/i,
  /\bnot just about\b.*?\bit'?s about\b/i,
  /\bintricate interplay\b/i,
  /\ba plethora of\b/i,
  /\bpave(?:s|d)?\s+the way\b/i,
];

// Mild tier patterns (~11)
const MILD_PATTERNS = [
  /\bindeed,/i,
  /\bcomprehensive guide\b/i,
  /\bnuanced understanding\b/i,
  /\binnovative solution\b/i,
  /\bessentially,/i,
  /\blet me break this down\b/i,
  /\b(?:additionally|consequently)\b/i,
  /\bcompelling narrative\b/i,
  /\bresonate(?:s|d)?\s+with\b/i,
  /\bstreamline(?:s|d)?\b/i,
  /\bthe\s+\w*\s*ecosystem\b/i,
];

const TIERS = [
  { severity: 'severe', patterns: SEVERE_PATTERNS },
  { severity: 'medium', patterns: MEDIUM_PATTERNS },
  { severity: 'mild', patterns: MILD_PATTERNS },
];

/**
 * Detect AI cliche phrases in text.
 * Checks severe first, returns highest severity found.
 * @param {string} text - Text to scan for cliches
 * @returns {{ severity: string, phrase: string, allMatches: Array<{severity: string, phrase: string}> } | null}
 */
function detectCliches(text) {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const allMatches = [];

  for (const tier of TIERS) {
    for (const pattern of tier.patterns) {
      const match = text.match(pattern);
      if (match) {
        allMatches.push({
          severity: tier.severity,
          phrase: match[0],
        });
      }
    }
  }

  if (allMatches.length === 0) {
    return null;
  }

  // Highest severity is first match found (we check severe -> medium -> mild)
  return {
    severity: allMatches[0].severity,
    phrase: allMatches[0].phrase,
    allMatches,
  };
}

module.exports = { detectCliches };
