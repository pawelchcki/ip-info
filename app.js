const { fork } = require('child_process');

const s = fork('grpc_server.js', { silent: false, execArgv: [] });
const s2 = fork('grpc_server.js', { silent: false, execArgv: [] });

s.on('message', (data) => {
  console.log("c", data);
});

s2.on('message', (data) => {
  console.log("c", data);
});

s.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});

s2.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});