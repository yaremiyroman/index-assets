'use strict';

const fs = require('fs').promises;
const { open, close, writeFileSync } = require('fs');
const { EOL } = require('os');
const path = require('path');

const targetFolderAbsolute = path.resolve(__dirname, '../../src/images');

const index = async (dir) => {
  let files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const SVGs = entries.filter(entry => path.extname(entry.name) === '.svg');

  SVGs.forEach(entry => files.push(`${dir}/${entry.name}`));

  for (const entry of entries) {
    if (entry.isDirectory()) {
      console.log('=== entry ==>', entry);
      files = [
        ...files,
        ...(await index(`${dir}/${entry.name}`)),
      ];
    }
  }

  return files;
};

const record = (fd, files) => {
  const records = [];

  files.forEach(file => {
    const fileName = path.parse(file).name;
    const exportFullRelPath = file.substr(targetFolderAbsolute.length);
    const fileParents = exportFullRelPath.substr(0, exportFullRelPath.indexOf(fileName)).split('/').filter(name => !!name.length);
    const exportName = records.includes(fileName) ? `${fileParents.join('-')}-${fileName}` : fileName;
    const fileFormattedName = exportName.replace(/-([a-z])/g, (m, w) => w.toUpperCase());
    const record = `export { default as ${fileFormattedName} } from '.${exportFullRelPath}';${EOL}`;

    records.push(exportName);
    writeFileSync(fd, record);
  });

  close(fd, () => console.log('+++ Indexed +++'));
}

index(targetFolderAbsolute).then(files =>
  open(path.join(targetFolderAbsolute, 'index.js'), 'w', (err, fd) => record(fd, files)))

module.exports = index;
