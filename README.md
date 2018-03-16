# Service IP info

Respond with information if the IP is blocked by any of the approved blacklist.

## Features

- Automatically update blacklist from https://github.com/firehol/blocklist-ipsets 
- Fast response time
- Allow configuring which blacklist will be used 

## Considered features

- Include current snapshot of the blacklist when service is packaged, so that it could retain some functionality without fetching
- Provide health check endpoint
- Provide metrics (response time, time to process blacklist files, seconds since last update, count of blocked/allowed ips)

## Design 

Use Radix/Patricia trees to encode list of blacklisted IPs and subnets. This allows fast retrieval, at the cost of insertion time.

The service will use Git-HTTP protocol to clone and update the repository with blacklists periodically.

Blacklists repository will be stored in a temporary folder and cleaned before service exits.

### Data reloading

Reloading the data can take considerable amount of time and CPU resources, as such it cannot be done in the same process that handles
requests without negatively impacting throughput.

To allow safe reloading of data a minimum of 3 process setup can be used with two classes of processes

#### Master Process

Is launched as first and is responsible for spawning new processes and ensuring there is always specific number of worker processes that have successfully loaded the data.

Can also poll for changes and update the folder with the data, triggering restart of the processes.

When new data is detected its fetched and a new Worker is spawned. Once that worker signals its ready old worker process is reaped.

#### Worker processes

In normal operation at least one worker process is used, it serves incoming requests using GRPC.

At startup time it loads the configured blacklists and signals the Master process that its ready to receive requests.

## GRPC based API

```proto3
syntax = "proto3";

service IpInfo {
  rpc IsIpSafe (IsIpSafeRequest) returns (IpIsSafeResponse);
}
message IsIpSafeRequest {
  string ip = 1;
}

message IpIsSafeResponse {
  message RejectedDescription {
    string source = 1;
    string rule = 2;
  }

  bool safe = 1;
  repeated RejectedDescription rejected_by = 2;
}

```

## Tools

### `benchmark.js` [server:port] [ip_to_check] [repeatQuery]

This simple script can be used to benchmark the service

### `client.js` [server:port] [ip_to_check]

Query service for information about given IP
