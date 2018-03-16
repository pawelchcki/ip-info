const { fork } = require('child_process');

var current_worker = null;
var worker_no = 0;

function build_worker() {
  const worker = fork('grpc_worker.js', ['blocklist-ipsets'], { silent: false, execArgv: [] });
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
    if (data === 'ready'){
      callback(worker);
    }
  });
}

function simulateUpdate(time){
  setTimeout(()=>{
    console.log('source is updated - reload worker');
    
    worker_ready(build_worker(), (worker) => {
      if (current_worker !== null){
        current_worker.kill();
      }
      
      current_worker = worker;
      simulateUpdate(1000);
    });
    
  }, time);
}

simulateUpdate(1);