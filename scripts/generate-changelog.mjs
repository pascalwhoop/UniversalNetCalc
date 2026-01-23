#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Generate changelog from commits since last tag
 */
function generateChangelog() {
  try {
    // Get the last tag
    let lastTag;
    try {
      lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf-8' }).trim();
    } catch {
      // No tags yet, use first commit
      lastTag = execSync('git rev-list --max-parents=0 HEAD', { encoding: 'utf-8' }).trim();
    }

    // Get commits since last tag
    let commits;
    try {
      commits = execSync(`git log ${lastTag}..HEAD --oneline --format=%B%x00`, {
        encoding: 'utf-8',
      }).trim();
    } catch {
      // If comparing fails, get recent commits
      commits = execSync('git log --oneline --format=%B%x00 HEAD~20..HEAD', {
        encoding: 'utf-8',
      }).trim();
    }

    if (!commits) {
      console.log('No new commits since last tag');
      return '';
    }

    // Parse commits by type
    const categories = {
      Added: [],
      Changed: [],
      Fixed: [],
      Documentation: [],
      Performance: [],
      Tests: [],
      Maintenance: [],
    };

    const commitMessages = commits.split('\x00').filter(Boolean);

    for (const message of commitMessages) {
      const lines = message.trim().split('\n');
      const firstLine = lines[0];

      // Skip merge commits and version bump commits
      if (firstLine.startsWith('Merge ') || firstLine.startsWith('chore: bump')) {
        continue;
      }

      // Parse conventional commit format
      const match = firstLine.match(/^(feat|fix|docs|refactor|perf|test|chore|ci|style)(\(.+\))?!?:\s*(.+)$/);

      if (match) {
        const [, type, , description] = match;
        const item = `- ${description}`;

        switch (type) {
          case 'feat':
            categories.Added.push(item);
            break;
          case 'fix':
            categories.Fixed.push(item);
            break;
          case 'docs':
            categories.Documentation.push(item);
            break;
          case 'refactor':
            categories.Changed.push(item);
            break;
          case 'perf':
            categories.Performance.push(item);
            break;
          case 'test':
            categories.Tests.push(item);
            break;
          case 'chore':
          case 'ci':
          case 'style':
            categories.Maintenance.push(item);
            break;
        }
      } else if (firstLine.trim()) {
        // If it doesn't follow conventional commit format, treat as a change
        categories.Changed.push(`- ${firstLine}`);
      }
    }

    // Build changelog entry
    let changelog = '';

    if (categories.Added.length > 0) {
      changelog += '### Added\n\n' + categories.Added.join('\n') + '\n\n';
    }

    if (categories.Fixed.length > 0) {
      changelog += '### Fixed\n\n' + categories.Fixed.join('\n') + '\n\n';
    }

    if (categories.Changed.length > 0) {
      changelog += '### Changed\n\n' + categories.Changed.join('\n') + '\n\n';
    }

    if (categories.Performance.length > 0) {
      changelog += '### Performance\n\n' + categories.Performance.join('\n') + '\n\n';
    }

    if (categories.Documentation.length > 0) {
      changelog += '### Documentation\n\n' + categories.Documentation.join('\n') + '\n\n';
    }

    if (categories.Tests.length > 0) {
      changelog += '### Tests\n\n' + categories.Tests.join('\n') + '\n\n';
    }

    if (categories.Maintenance.length > 0) {
      changelog += '### Maintenance\n\n' + categories.Maintenance.join('\n') + '\n\n';
    }

    return changelog.trim();
  } catch (error) {
    console.error('Error generating changelog:', error.message);
    process.exit(1);
  }
}

/**
 * Update CHANGELOG.md with new entry
 */
function updateChangelog(version, changelog) {
  const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');

  if (!fs.existsSync(changelogPath)) {
    console.error('CHANGELOG.md not found');
    process.exit(1);
  }

  const content = fs.readFileSync(changelogPath, 'utf-8');
  const date = new Date().toISOString().split('T')[0];

  // Create new version section
  const versionSection = `## [${version}] - ${date}\n\n${changelog}\n\n`;

  // Find the "Unreleased" section and insert after it
  const unreleeasedIndex = content.indexOf('## [Unreleased]');
  if (unreleeasedIndex === -1) {
    console.error('[Unreleased] section not found in CHANGELOG.md');
    process.exit(1);
  }

  // Find the end of the Unreleased section (next ## or end of file)
  const nextSectionIndex = content.indexOf('\n## [', unreleeasedIndex + 1);
  const insertIndex = nextSectionIndex === -1 ? unreleeasedIndex + '## [Unreleased]'.length : nextSectionIndex;

  // Insert the new version section
  const updatedContent =
    content.substring(0, insertIndex) +
    '\n\n' +
    versionSection +
    content.substring(insertIndex);

  fs.writeFileSync(changelogPath, updatedContent);
  console.log(`✓ Updated CHANGELOG.md with v${version}`);
}

// Main execution
if (process.argv[2] === 'update') {
  const version = process.argv[3];
  if (!version) {
    console.error('Version argument required: generate-changelog.mjs update <version>');
    process.exit(1);
  }
  const changelog = generateChangelog();
  updateChangelog(version, changelog);
} else {
  // Just generate and output
  const changelog = generateChangelog();
  console.log(changelog);
}
