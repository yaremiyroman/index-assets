'use strict';

const fs = require('fs').promises;
const { open, close, writeFileSync, watch } = require('fs');
const { EOL } = require('os');
const path = require('path');
const camelCase = require('camelcase');
const targetFolderAbsolute = path.resolve(__dirname, '../../src/images');

const index = async (dir) => {
  let files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  entries.forEach(entry => path.extname(entry.name) === '.svg' && files.push(`${dir}/${entry.name}`));

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
    const record = `export { default as ${camelCase(exportName)} } from '.${exportFullRelPath}';${EOL}`;

    records.push(exportName);
    writeFileSync(fd, record);
  });

  close(fd, () => console.log('+++ Indexed +++'));
}

const indexDir = dir =>
  index(dir).then(files =>
    open(path.join(dir, 'index.js'), 'w', (err, fd) =>
      record(fd, files)))

const watchStatic = dir =>
  indexDir(dir).then(watch(dir, (event, filename) =>
    (event == 'change' || event == 'rename') && path.extname(filename) === '.svg' && indexDir(dir)
  ));

module.exports = watchStatic;
module.exports.default = module.exports;
