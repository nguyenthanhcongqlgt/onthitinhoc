/**
 * Smart Code Formatter
 * Reconstructs proper indentation for code snippets (Python, C++, SQL, HTML, CSS)
 * that lost spacing formatting during docx import or copy-paste,
 * while strictly preserving code that already has valid indentation.
 * 
 * Includes:
 * - cleanCodeSnippet: strips only leading/trailing empty lines without damaging line 1 indentation.
 * - dedent: removes common leading whitespace across all non-blank lines.
 * - repairFirstLineStripped: detects and repairs anomalies where line 1 was stripped of indentation
 *   while subsequent lines retained an outer margin.
 */

/**
 * Strips leading and trailing empty lines only.
 * NEVER removes leading spaces of the first non-empty line.
 */
export function cleanCodeSnippet(code: string): string {
  if (!code) return '';

  const normalized = code
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, '    ')
    .replace(/\u00a0/g, ' ');

  const lines = normalized.split('\n');
  while (lines.length > 0 && !lines[0].trim()) {
    lines.shift();
  }
  while (lines.length > 0 && !lines[lines.length - 1].trim()) {
    lines.pop();
  }
  return lines.join('\n');
}

/**
 * Removes any common leading whitespace from every non-blank line.
 */
export function dedent(code: string): string {
  const cleaned = cleanCodeSnippet(code);
  if (!cleaned) return '';

  const lines = cleaned.split('\n');
  const nonBlankLines = lines.filter((l) => l.trim().length > 0);
  if (nonBlankLines.length === 0) return cleaned;

  let minIndent = Infinity;
  for (const line of nonBlankLines) {
    const indentMatch = line.match(/^([ ]*)/);
    const indentLen = indentMatch ? indentMatch[1].length : 0;
    if (indentLen < minIndent) {
      minIndent = indentLen;
    }
  }

  if (minIndent > 0 && minIndent !== Infinity) {
    return lines
      .map((l) => (l.trim().length > 0 ? l.slice(minIndent) : ''))
      .join('\n');
  }

  return cleaned;
}

/**
 * Detects and repairs anomalies where line 1 has 0 indentation (e.g. from an unintended trim()),
 * but line 1 is NOT a block-opening statement (does not end with ':', '{'),
 * and lines 2+ all share an extra common indentation (e.g. 4 spaces).
 */
export function repairFirstLineStripped(code: string, language: string = 'python'): string {
  const lines = code.split('\n');
  const nonBlankIndices: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().length > 0) {
      nonBlankIndices.push(i);
    }
  }

  if (nonBlankIndices.length < 2) {
    return code;
  }

  const firstIdx = nonBlankIndices[0];
  const firstLine = lines[firstIdx];
  const firstIndentMatch = firstLine.match(/^([ ]*)/);
  const firstIndent = firstIndentMatch ? firstIndentMatch[1].length : 0;

  const firstTrimmed = firstLine.trim();
  const langLower = (language || 'python').toLowerCase();

  let opensBlock = false;
  if (langLower === 'python' || langLower === 'py' || langLower === 'python3') {
    opensBlock =
      firstTrimmed.endsWith(':') ||
      /^(def\b|class\b|if\b|for\b|while\b|try\b|with\b|async\b)/.test(firstTrimmed);
  } else if (
    langLower === 'cpp' ||
    langLower === 'c++' ||
    langLower === 'c' ||
    langLower === 'javascript' ||
    langLower === 'js' ||
    langLower === 'java' ||
    langLower === 'css'
  ) {
    opensBlock = firstTrimmed.endsWith('{') || firstTrimmed.includes('{');
  }

  if (!opensBlock && firstIndent === 0) {
    const subsequentIndices = nonBlankIndices.slice(1);
    let minSubsequentIndent = Infinity;

    for (const idx of subsequentIndices) {
      const match = lines[idx].match(/^([ ]*)/);
      const indentLen = match ? match[1].length : 0;
      if (indentLen < minSubsequentIndent) {
        minSubsequentIndent = indentLen;
      }
    }

    if (minSubsequentIndent >= 2 && minSubsequentIndent !== Infinity) {
      const repaired = [...lines];
      for (const idx of subsequentIndices) {
        if (repaired[idx].trim().length > 0) {
          repaired[idx] = repaired[idx].slice(minSubsequentIndent);
        }
      }
      return repaired.join('\n');
    }
  }

  return code;
}

export function autoIndentPython(rawCode: string): string {
  const lines = rawCode.split('\n');
  const result: string[] = [];
  let currentIndent = 0;
  let inWhile = false;
  let whileCounterVar: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      result.push('');
      continue;
    }

    // Dedent for block continuations
    if (/^(elif\b|else\s*:|except\b|finally\s*:)/.test(line)) {
      currentIndent = Math.max(0, currentIndent - 1);
    } else if (inWhile && whileCounterVar) {
      // Insertion sort / loop pattern: statement modifying other variable right after counter dec
      const isCounterDec = new RegExp(`^${whileCounterVar}\\s*(-=|\\+=|=)`).test(line);
      if (!isCounterDec && !/^(while\b|for\b|if\b)/.test(line)) {
        currentIndent = Math.max(0, currentIndent - 1);
        inWhile = false;
        whileCounterVar = null;
      }
    }

    result.push('    '.repeat(currentIndent) + line);

    // Track while loop counter variable
    const whileMatch = line.match(/^while\s+([a-zA-Z_]\w*)/);
    if (whileMatch) {
      inWhile = true;
      whileCounterVar = whileMatch[1];
    }

    // Check if line opens a new block
    if (
      line.endsWith(':') ||
      /^(def\b|class\b|if\b|elif\b|else\s*:|for\b|while\b|try\s*:|except\b|finally\s*:|with\b|async\s+def\b|async\s+for\b)/.test(line)
    ) {
      currentIndent += 1;
    } else if (/^(return\b|pass\b|break\b|continue\b|raise\b)/.test(line)) {
      if (
        currentIndent > 0 &&
        i + 1 < lines.length &&
        !/^(elif\b|else\s*:|except\b|finally\s*:)/.test(lines[i + 1].trim())
      ) {
        currentIndent = Math.max(0, currentIndent - 1);
      }
    }
  }

  return result.join('\n');
}

export function autoIndentCpp(rawCode: string): string {
  const lines = rawCode.split('\n');
  const result: string[] = [];
  let indentLevel = 0;
  let nextSingleIndent = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      result.push('');
      continue;
    }

    // Preprocessor directives stay at root level
    if (line.startsWith('#')) {
      result.push(line);
      continue;
    }

    // Access specifiers
    if (/^(public|private|protected)\s*:/.test(line)) {
      result.push('    '.repeat(Math.max(0, indentLevel - 1)) + line);
      continue;
    }

    // Closing braces count on current line
    const closeBraces = (line.match(/\}/g) || []).length;
    const openBraces = (line.match(/\{/g) || []).length;

    if (line.startsWith('}')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    const appliedIndent = indentLevel + (nextSingleIndent ? 1 : 0);
    result.push('    '.repeat(Math.max(0, appliedIndent)) + line);

    if (nextSingleIndent && !line.endsWith(';')) {
      // keep single indent
    } else {
      nextSingleIndent = false;
    }

    // Update indent level for following lines
    if (line.startsWith('}')) {
      indentLevel += Math.max(0, openBraces - (closeBraces - 1));
    } else {
      indentLevel = Math.max(0, indentLevel + openBraces - closeBraces);
    }

    // Check if next line is a single statement under if/for/while without braces
    if (
      /^(if\s*\(|for\s*\(|while\s*\(|else\b)/.test(line) &&
      !line.includes('{') &&
      !line.endsWith(';')
    ) {
      nextSingleIndent = true;
    }
  }

  return result.join('\n');
}

export function autoIndentCss(rawCode: string): string {
  const lines = rawCode.split('\n');
  const result: string[] = [];
  let indentLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      result.push('');
      continue;
    }

    if (line.startsWith('}')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    result.push('    '.repeat(Math.max(0, indentLevel)) + line);

    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;

    if (line.startsWith('}')) {
      indentLevel += Math.max(0, openBraces - (closeBraces - 1));
    } else {
      indentLevel = Math.max(0, indentLevel + openBraces - closeBraces);
    }
  }

  return result.join('\n');
}

/**
 * Main function: formats code while preserving existing indentation,
 * dedenting common margins, and repairing first-line-stripped anomalies.
 */
export function formatCode(code: string, language: string = 'python'): string {
  if (!code || !code.trim()) return '';

  // 1. Clean leading/trailing blank lines and dedent common whitespace
  let processed = dedent(code);

  // 2. Repair first-line-stripped anomalies
  processed = repairFirstLineStripped(processed, language);

  const lines = processed.split('\n');

  // Check if code ALREADY has valid multi-line indentation (2+ leading spaces)
  const hasExistingIndent = lines.some((l) => /^\s{2,}\S/.test(l));
  if (hasExistingIndent) {
    return processed;
  }

  const lang = (language || 'python').toLowerCase();
  if (lang === 'python' || lang === 'py' || lang === 'python3') {
    return autoIndentPython(processed);
  } else if (
    lang === 'cpp' ||
    lang === 'c++' ||
    lang === 'c' ||
    lang === 'java' ||
    lang === 'javascript' ||
    lang === 'js'
  ) {
    return autoIndentCpp(processed);
  } else if (lang === 'css' || lang === 'css3') {
    return autoIndentCss(processed);
  }

  return processed;
}
