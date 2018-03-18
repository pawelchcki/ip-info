const grpc = require('grpc');
const grpc_service = grpc.load(`${__dirname}/protos/ip_info.proto`);

const { RouterFactory } = require('./lib/router_factory');
const { FSDataSetsLoader } = require('./lib/fs_data_sets_loader');
const { IpSafeService } = require('./services/ip_safe_service');
const { addService } = require('./lib/service_wrapper');
const config = require('config');

const sourceDir = config.get('blacklist.repository_storage');
const bindAddress = config.get('server.address');
const enabledBlacklists = config.get('blacklist.enabled_files');

function onlyEnabledBlacklists({ dataSet }) {
  enabledBlacklists.some((blackList) => blackList === dataSet);
}

const dataSetsSource = new FSDataSetsLoader(sourceDir).load().filter(onlyEnabledBlacklists);

const server = new grpc.Server();
new RouterFactory(dataSetsSource).build().subscribe((router) => {
  const ipSafeService = new IpSafeService(router);

  addService(server, grpc_service.IpInfo.service, { isIpSafe: ipSafeService });

  server.bind(bindAddress, grpc.ServerCredentials.createInsecure());
  server.start();

  if (process.send) {
    process.send('ready');
  }
});

