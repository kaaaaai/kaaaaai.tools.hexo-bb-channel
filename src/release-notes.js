function normalizeVersion(version) {
  return String(version || '').trim().replace(/^v/, '');
}

function extractReleaseNotes(changelog, version) {
  const targetVersion = normalizeVersion(version);
  if (!targetVersion) throw new Error('Missing release version');

  const lines = String(changelog || '').split(/\r?\n/);
  const headingPattern = /^##\s+(.+?)\s*$/;
  let collecting = false;
  const notes = [];

  for (const line of lines) {
    const heading = line.match(headingPattern);
    if (heading) {
      const headingVersion = normalizeVersion(heading[1].split(/\s+-\s+/)[0]);
      if (collecting) break;
      collecting = headingVersion === targetVersion;
      continue;
    }

    if (collecting) notes.push(line);
  }

  const result = notes.join('\n').trim();
  if (!result) throw new Error('No changelog notes found for ' + targetVersion);
  return result;
}

module.exports = {
  extractReleaseNotes,
};
