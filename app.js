const { fork } = require('child_process');
const { Observable } = require('rxjs');
const config = require('config');
const Git = require('nodegit');


var current_worker = null;
var worker_no = 0;

function build_worker() {
  const worker = fork('grpc_worker.js', { silent: false, execArgv: [] });
  worker.number = worker_no;
  worker_no++;

  worker.on('message', (data) => {
    console.log(`worker(${worker.number})`, data);
  });

  worker.on('close', (code) => {
    console.log(`worker(${worker.number}) exited with code ${code}`);
  });

  return worker;
}

function worker_ready(worker, callback) {
  worker.on('message', (data) => {
    if (data === 'ready') {
      callback(worker);
    }
  });
}

const pollingInterval = config.get('blacklist.polling_interval');
const repositoryUrl = config.get('blacklist.repository_url');
Observable.interval(pollingInterval);

const tmp = require('tmp');
const fs = require('fs');
const dir = tmp.dirSync();

const repositoryStorage = config.get('blacklist.repository_storage');
if (!repositoryStorage) {
  console.log('Repository strage not configured');
  process.exit(1);
}


const cloneRepo = Observable.defer(() => {
  console.log(`Cloning ${repositoryUrl} to ${repositoryStorage}`);
  return Git.Clone(repositoryUrl, repositoryStorage);
});

var currentOid = null;

Observable.defer(() => {
  console.log(`Initializing repository ${repositoryStorage}`);
  return Git.Repository.open(repositoryStorage);
})
  .catch(() => cloneRepo)
  .do(() => console.log('Done'))
  .subscribe((repo) => {
    Observable.from(repo.head())
      .map(ref => ref.target())
      .do((oid) => currentOid = oid)
      .subscribe(() => {
        console.log(`Starting polling upstream repo every ${pollingInterval}ms`);
        Observable.interval(pollingInterval)
          .flatMap(() => repo.fetch('origin'))
          .flatMap(() => Observable.zip(repo.head(), repo.getReference('origin/master')))
          .filter(([head, origin]) => head.target().cmp(origin.target()))
          .do(([head, origin]) => console.log(`Updating repo from ${head.target()}, to ${origin.target()}`))
          .flatMap(([, origin]) => repo.getCommit(origin.target()))
          .flatMap(originCommit => Git.Reset.reset(repo, originCommit, Git.Reset.TYPE.HARD))
          .do(() => console.log(`Updated`))
          .subscribe(console.log);
      });
  });

function simulateUpdate(time) {
  setTimeout(() => {
    console.log('source is updated - reload worker');

    worker_ready(build_worker(), (worker) => {
      if (current_worker !== null) {
        current_worker.kill();
      }

      current_worker = worker;
      simulateUpdate(100);
    });

  }, time);
}

// simulateUpdate(1);