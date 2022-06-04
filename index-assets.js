'use strict';

const fs = require('fs').promises;
const { open, close, writeFileSync, watch } = require('fs');
const { EOL } = require('os');
const path = require('path');
// const paths = require('../config/paths');
const targetFolderAbsolute = path.resolve(__dirname, '../../src/images');

const index = async (dir) => {
  let files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const SVGs = entries.filter(entry => path.extname(entry.name) === '.svg');

  SVGs.forEach(entry => files.push(`${dir}/${entry.name}`));

  for (const entry of entries) {
    if (entry.isDirectory()) {
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

const watchD = dir =>
  watch(dir, (event, filename) => {
    if (path.extname(filename) === '.svg') {
      console.log('+++ svg +++> ');
      if (event == 'change' || event == 'rename') {
        console.log('+++ event +++> ', event);
        indexDir(dir);
      }
    }
  });

const indexDir = dir =>
  index(dir).then(files =>
    open(path.join(dir, 'index.js'), 'w', (err, fd) =>
      record(fd, files)))

module.exports = watchD;
module.exports.default = module.exports;
