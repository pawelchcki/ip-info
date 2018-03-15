const PROTO_PATH = __dirname + '/protos/ip_info.proto';

const grpc = require('grpc');
const ip_info = grpc.load(PROTO_PATH);

process.send('started');
process.send(process.pid);



function isIpSafe(call, callback) {
  callback(null, { safe: true, rejected_by: { source: `${process.pid}` } });
}

const server = new grpc.Server();
server.addService(ip_info.IpInfo.service, { isIpSafe: isIpSafe });
server.bind('0.0.0.0:50051', grpc.ServerCredentials.createInsecure());

server.start();