const _ = require('lodash');

function addService(server, service, servicesMap){
  const callbacksMap = _.mapValues(servicesMap, (svc)=>{
    return (call, callback) => callback(null, svc.handle(call.request));
  });
  server.addService(service, service, callbacksMap);
}

module.exports.addService = addService;