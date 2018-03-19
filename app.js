const { fork } = require('child_process');
const { Observable } = require('rxjs');
const config = require('config');
const Git = require('nodegit');


var currentWorker = null;
var workerNo = 0;

function buildWorker(callback) {
  const worker = fork('grpc_worker.js', { silent: false, execArgv: [] });
  worker.number = workerNo;
  workerNo++;

  worker.on('message', (data) => {
    console.log(`worker(${worker.number})`, data);
  });

  worker.on('close', (code) => {
    console.log(`worker(${worker.number}) exited with code ${code}`);
  });

  worker.on('message', (data) => {
    if (data === 'ready') {
      callback(worker);
    }
  });

  return worker;
}

const buildWorkerRx = Observable.bindCallback(buildWorker);

function reloadWorker() {
  return buildWorkerRx().map((worker) => {
    if (currentWorker !== null) {
      currentWorker.kill();
    }

    currentWorker = worker;
    return currentWorker;
  });
}

const pollingInterval = config.get('blacklist.polling_interval');
const repositoryUrl = config.get('blacklist.repository_url');
Observable.interval(pollingInterval);

const repositoryStorage = config.get('blacklist.repository_storage');
if (!repositoryStorage) {
  console.log('Repository strage not configured');
  process.exit(1);
}

const cloneRepo = Observable.defer(() => {
  console.log(`Cloning ${repositoryUrl} to ${repositoryStorage}`);
  return Git.Clone(repositoryUrl, repositoryStorage);
});

Observable.defer(() => {
  console.log(`Initializing repository ${repositoryStorage}`);
  return Git.Repository.open(repositoryStorage);
})
  .catch(() => cloneRepo)
  .do(() => console.log('Done'))
  .subscribe((repo) => {
    reloadWorker().subscribe(() => { console.log("Worker spawned");});
    
    Observable.from(repo.getRemote('origin'))
      .filter(remote => remote.url() !== repositoryUrl)
      .do(() => console.log(`Setting new repository URL ${repositoryUrl}`))
      .map(() => Git.Remote.setUrl(repo, 'origin', repositoryUrl))
      .subscribe(null, null, () => {
        console.log(`Starting polling upstream repo every ${pollingInterval}ms`);
        Observable.interval(pollingInterval)
          .flatMap(() => repo.fetch('origin'))
          .flatMap(() => Observable.zip(repo.head(), repo.getReference('origin/master')))
          .filter(([head, origin]) => head.target().cmp(origin.target()))
          .do(([head, origin]) => console.log(`Updating repo from ${head.target()}, to ${origin.target()}`))
          .flatMap(([, origin]) => repo.getCommit(origin.target()))
          .flatMap(originCommit => Git.Reset.reset(repo, originCommit, Git.Reset.TYPE.HARD))
          .do(() => console.log(`Updated`))
          .subscribe(() => {
            console.log('Source repo updated - reloading worker');
            reloadWorker().subscribe(() => { console.log("Worker reloaded"); });
          });
      });
  });
