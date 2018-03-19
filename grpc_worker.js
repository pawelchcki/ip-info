const grpc = require('grpc');

const { RouterFactory } = require('./lib/router_factory');
const { FSDataSetsLoader } = require('./lib/fs_data_sets_loader');
const { IpSafeService } = require('./services/ip_safe_service');
const { setupGrpcRoutes } = require('./route/setup');
const config = require('config');

const sourceDir = config.get('blacklist.repository_storage');
const bindAddress = config.get('server.address');
const enabledBlacklists = config.get('blacklist.enabled_files');

if (!sourceDir) {
  console.log("Repository storage needs to be specified");
  process.exit(1);
}

function onlyEnabledBlacklists({ dataSet }) {
  return enabledBlacklists.some((blackList) => blackList === dataSet);
}

const dataSetsSource = new FSDataSetsLoader(sourceDir).load().filter(onlyEnabledBlacklists);
const server = new grpc.Server();

console.log(`Reading data from ${enabledBlacklists}`);
new RouterFactory(dataSetsSource).build().subscribe((router) => {
  console.log('Data processed');

  const ipSafeService = new IpSafeService(router);
  setupGrpcRoutes(server, { ipSafeService });

  server.bind(bindAddress, grpc.ServerCredentials.createInsecure());
  server.start();

  if (process.send) {
    process.send('ready');
  }
});
