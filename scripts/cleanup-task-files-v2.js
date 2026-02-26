#!/usr/bin/env node
/**
 * Cleanup script for dom-to-markdown skill development tasks.
 * Moves temporary debug/test files to archive after task completion.
 * Version 2: Cleans both logs/ and root directory.
 */

const fs = require('fs');
const path = require('path');

const skillRoot = path.join(__dirname, '..');
const logsDir = path.join(skillRoot, 'logs');
const rootArchiveDir = path.join(skillRoot, 'archive');
const logsArchiveDir = path.join(logsDir, 'archive');

// Ensure archive directories exist
[logsArchiveDir, rootArchiveDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Files to keep (important results) - relative to each directory
const keepPatterns = [
  'llm-dev-state.json',
  'llm-dev-*.log',
  'file-cleanup.log',
  '*-results.json',
  '*-results-*.json',
  'cache-store.js',
  'converter.js',
  'detector.js',
  'playwright-wrapper.js',
  'politeness.js',
  'browser-wrapper.js',
  'index.js',
  'demo.js',
  'package.json',
  '*.md',
  '*.txt',
  'scripts/*',
  'examples/*',
  'demos/*',
  'src/*',
  'tests/*',
  'exports/**/*',
  'test-reports/*.json'  // test reports are kept
];

// Patterns for temporary files to archive
const tempPatterns = [
  'debug-*.js',
  '*-test.js',
  '*-test-*.js',
  'test-*.js',
  'test-run-*.log',
  'politeness-*.js',
  'spa-detection-new-sites.js',
  'temp-*.js'
];

// Directories to scan
const scanDirs = [
  { path: logsDir, archive: logsArchiveDir, name: 'logs' },
  { path: skillRoot, archive: rootArchiveDir, name: 'root' }
];

function matchesPattern(filename, pattern) {
  if (pattern.includes('*')) {
    // Convert wildcard pattern to regex
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(filename);
  }
  return filename === pattern;
}

function shouldKeep(filename, relativePath) {
  // Check if file matches any keep pattern
  for (const pattern of keepPatterns) {
    if (matchesPattern(filename, pattern) || matchesPattern(relativePath, pattern)) {
      return true;
    }
  }
  return false;
}

function isTemporary(filename) {
  for (const pattern of tempPatterns) {
    if (matchesPattern(filename, pattern)) {
      return true;
    }
  }
  return false;
}

function scanDirectory(dirPath, archivePath, dirName) {
  const moved = [];
  const kept = [];
  
  if (!fs.existsSync(dirPath)) {
    return { moved, kept };
  }

  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    // Skip archive directories
    if (item === 'archive' || item === 'node_modules' || item === '.git') {
      continue;
    }
    
    const itemPath = path.join(dirPath, item);
    const relativePath = path.relative(skillRoot, itemPath);
    
    // Handle directories
    if (fs.statSync(itemPath).isDirectory()) {
      // For now, skip directories (they're handled by patterns)
      continue;
    }
    
    // Check if should keep
    if (shouldKeep(item, relativePath)) {
      kept.push(item);
      continue;
    }
    
    // Check if temporary
    if (isTemporary(item)) {
      const dest = path.join(archivePath, item);
      fs.renameSync(itemPath, dest);
      moved.push(item);
    } else {
      kept.push(item);
    }
  }
  
  return { moved, kept };
}

function main() {
  console.log('🧹 Cleaning up temporary files...');
  
  const totalMoved = [];
  const totalKept = [];
  
  for (const { path: dirPath, archive: archivePath, name: dirName } of scanDirs) {
    console.log(`\nScanning ${dirName} directory...`);
    const { moved, kept } = scanDirectory(dirPath, archivePath, dirName);
    
    if (moved.length > 0) {
      console.log(`  Moved ${moved.length} files to ${dirName}/archive:`);
      moved.forEach(f => console.log(`    - ${f}`));
      totalMoved.push(...moved.map(f => `${dirName}/${f}`));
    }
    
    if (kept.length > 0) {
      console.log(`  Kept ${kept.length} files`);
      totalKept.push(...kept.map(f => `${dirName}/${f}`));
    }
  }
  
  // Log cleanup
  const cleanupLog = path.join(logsDir, 'file-cleanup.log');
  const timestamp = new Date().toISOString();
  const logEntry = `\n## ${timestamp}\n- Task: Enhanced cleanup (v2)\n- Moved: ${totalMoved.length} files\n${totalMoved.map(f => `  - ${f}`).join('\n')}\n- Kept: ${totalKept.length} files\n`;
  fs.appendFileSync(cleanupLog, logEntry);
  
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Cleanup completed: moved ${totalMoved.length} files to archive, kept ${totalKept.length} files.`);
}

if (require.main === module) {
  main();
}

module.exports = { main };