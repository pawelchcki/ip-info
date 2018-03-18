const grpc = require('grpc');
const _ = require('lodash');
const grpc_service = grpc.load(`${__dirname}/../protos/ip_info.proto`);

function addService(server, service, servicesMap){
  const callbacksMap = _.mapValues(servicesMap, (svc)=>{
    return (call, callback) => callback(null, svc.handle(call.request));
  });
  server.addService(service, service, callbacksMap);
}

function setupGrpcRoutes(server, services){
  addService(server, grpc_service.IpInfo.service, { isIpSafe: services.ipSafeService });
}

module.exports.setupGrpcRoutes = setupGrpcRoutes;