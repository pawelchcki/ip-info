const grpc = require('grpc');
const { Observable } = require('rxjs');

const ip_info_proto = `${__dirname}/protos/ip_info.proto`;
const grpc_service = grpc.load(ip_info_proto);

const args = process.argv.slice(2);
const server = args[0] || 'localhost:50052';
const ip = args[1] || '192.168.1.1';
const repeat = args[2] || 100000;

console.log(`Sending ${repeat} requests with ${ip} to ${server}`);


const isSafeWithNewClient = Observable.bindNodeCallback((args, callback) => {
  const client = new grpc_service.IpInfo(server, grpc.credentials.createInsecure());
  return client.IsIpSafe(args, callback);
});

const client = new grpc_service.IpInfo(server, grpc.credentials.createInsecure());

const isSafe = Observable.bindNodeCallback((args, callback) => {
  return client.IsIpSafe(args, callback);
});

function callIsSafe(args) {
  return isSafe(args).catch(()=>isSafeWithNewClient(args));
}

function run() {
  console.time('total time');

  const requests = Observable.range(0, 100000)
        .bufferCount(8)
        .map((block) => Observable.concat(block.map(() => callIsSafe({ ip: ip })))
            .mergeAll()
            .retry(10)
            .count())
        .mergeAll(100)
        .bufferTime(1000)
        .map((items) => items.reduce((acc, value) => acc += value, 0))
        .do((rps) => console.log("req/s:", rps))
        .reduce((acc, value) => acc += value, 0);

  requests.subscribe((count) => { console.log("num of requests: ", count); }, console.log, () => {
    console.timeEnd('total time');    
  });
}

run();
