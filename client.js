const grpc = require('grpc');
const { Observable } = require('rxjs');

const ip_info_proto = `${__dirname}/protos/ip_info.proto`;
const grpc_service = grpc.load(ip_info_proto);

const args = process.argv.slice(2);
const server = args[0] || 'localhost:50052';
const ip = args[1] || '192.168.1.1';

var client = new grpc_service.IpInfo(server, grpc.credentials.createInsecure());

const isSafe = Observable.bindNodeCallback((args, callback) => {
  return client.IsIpSafe(args, callback);
});

isSafe({ ip: ip })
  .map((data) => JSON.stringify(data))
  .subscribe(console.log);
