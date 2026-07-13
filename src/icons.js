const fs = require('node:fs');

function loadLucideIcon(name, className) {
  const svgPath = require.resolve(`lucide-static/icons/${name}.svg`);
  return fs.readFileSync(svgPath, 'utf8')
    .replace(/<!--[\s\S]*?-->\s*/g, '')
    .replace(/class="[^"]*"/, `class="${className}"`)
    .replace('<svg', '<svg aria-hidden="true" focusable="false"');
}

module.exports = {
  externalLinkIcon: loadLucideIcon('external-link', 'bb-channel-lucide bb-channel-lucide-external-link'),
  fileIcon: loadLucideIcon('file', 'bb-channel-lucide bb-channel-lucide-file'),
};
