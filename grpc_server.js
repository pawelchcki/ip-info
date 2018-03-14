const PROTO_PATH = __dirname + '/protos/ip_info.proto';

const grpc = require('grpc');
const ip_info = grpc.load(PROTO_PATH);
const { inspect } = require('util');

process.send('started');
process.send(process.pid);

console.log(inspect(ip_info.IpInfo));

function isIpSafe(call, callback) {
  callback(null, { safe: true, rejected_by: { source: `${process.pid}` } });
  setTimeout(() => process.exit(4), 2000);
}

const server = new grpc.Server();
server.addService(ip_info.IpInfo.service, { isIpSafe: isIpSafe });
server.bind('0.0.0.0:50051', grpc.ServerCredentials.createInsecure());

server.start();