#!/usr/bin/env node
// DevFlow installer — copies SKILL.md and resources to .claude/skills/devflow/
// Triggered by: npx @santazuki/devflow  or  devflow install

const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '..');
const dest = path.join(
  process.env.HOME || process.env.USERPROFILE,
  '.claude', 'skills', 'devflow'
);

if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

const copy = (from, to) => {
  if (fs.statSync(from).isDirectory()) {
    if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
    fs.readdirSync(from).forEach(f => copy(path.join(from, f), path.join(to, f)));
  } else {
    fs.copyFileSync(from, to);
  }
};

['SKILL.md', 'resources', 'docs'].forEach(f => {
  const from = path.join(src, f);
  const to = path.join(dest, f);
  if (fs.existsSync(from)) {
    if (fs.existsSync(to)) fs.rmSync(to, { recursive: true, force: true });
    copy(from, to);
  }
});

console.log(`DevFlow installed → ${dest}`);
