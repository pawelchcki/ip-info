const { Observable } = require('rxjs');

const fs = require('fs');
const path = require('path');

const filesInDir = Observable.bindNodeCallback(fs.readdir);
const statFile = Observable.bindNodeCallback(fs.stat);
const readFile = Observable.bindNodeCallback(fs.readFile);

function listFilesRecursively(dir) {
  return filesInDir(dir)
    .mergeAll()
    .filter(fileName => !fileName.startsWith('.'))
    .map(fileName => path.join(dir, fileName))
    .flatMap(filePath =>
      statFile(filePath)
        .concatMap(file => {
          if (file.isDirectory()) {
            return listFilesRecursively(filePath);
          }
          return Observable.of(filePath);
        }));
}

class FSDataSetsLoader {
  constructor(sourceDir) {
    this.sourceDir = sourceDir;
  }

  onlyDataSets(filePath) {
    return filePath.match(/\.(ipset|netset)$/);
  }

  dataSetName(filePath) {
    return filePath
      .replace(path.normalize(this.sourceDir), '')
      .replace(/^[\\.\/]+/, '') // cleanup leading path characters
      .replace(/\\/g, '/'); // normalize path separators
  }

  load() {
    return listFilesRecursively(this.sourceDir)
      .filter(this.onlyDataSets)
      .map(filePath =>
        readFile(filePath, 'utf-8')
          .map((contents) => {
            return {
              dataSet: this.dataSetName(filePath),
              contents: contents.replace(/\r\n/g, "\n") // normalize line endings
            };
          })
      )
      .mergeAll();        
  }
}

module.exports.FSDataSetsLoader = FSDataSetsLoader;
