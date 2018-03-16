const grpc = require('grpc');
const ip_info_proto = `${__dirname}/protos/ip_info.proto`;
const grpc_service = grpc.load(ip_info_proto);

const args = process.argv.slice(2);

const sourceDir = args[0] || 'blocklist-ipsets';
const bindAddress = args[1] || '0.0.0.0:50052';

const { RouterFactory } = require('./lib/router_factory');
const { FSDataSetsLoader } = require('./lib/fs_data_sets_loader');
const { IpSafeService } = require('./services/ip_safe_service');

const dataSetsSource = new FSDataSetsLoader(sourceDir).load().take(100);
process.send('ingestion_start');

new RouterFactory().buildRouter(dataSetsSource).subscribe((router) => {
  process.send('ingestion_stop');
  const ipSafeService = new IpSafeService(router);

  const server = new grpc.Server();
  server.addService(grpc_service.IpInfo.service, { isIpSafe: (call, callback) => callback(null, ipSafeService(call.request)) });
  server.bind(bindAddress, grpc.ServerCredentials.createInsecure());

  server.start();

  process.send('ready');
});

