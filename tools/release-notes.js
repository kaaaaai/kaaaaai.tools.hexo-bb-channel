#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const { extractReleaseNotes } = require('../src/release-notes');

const root = path.join(__dirname, '..');
const packageJson = require(path.join(root, 'package.json'));
const version = process.env.RELEASE_TAG || packageJson.version;
const changelog = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');

process.stdout.write(extractReleaseNotes(changelog, version) + '\n');
