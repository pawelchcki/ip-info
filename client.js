const grpc = require('grpc');
const { Observable } = require('rxjs');

const ip_info_proto = `${__dirname}/protos/ip_info.proto`;
const grpc_service = grpc.load(ip_info_proto);

const args = process.argv.slice(2);

const server = args[0] || 'localhost:50052';


var client = new grpc_service.IpInfo(server, grpc.credentials.createInsecure());


const isSafe = Observable.bindNodeCallback((args, callback) => {
    return client.IsIpSafe(args, callback);
});


async function benchmark() {
    console.time('call');
    const requests = Observable.range(0, 10000).map(() => isSafe({ ip: '192.168.1.1' })).mergeAll()
    requests.subscribe(() => { }, console.log, () => {
        console.timeEnd('call');
        console.log('completed');
    })
    await requests.toPromise()
}

benchmark();