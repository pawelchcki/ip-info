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

## API

### GET `/safe_ip/<ip>`

Response when not blacklisted

200 OK

```json
{ safe: true }
```

Response when blacklisted

200 OK

```json
{ 
    safe: false, 
    rejected_by: [
        {
            name: 'path/to/blacklist',
            rule: '89.1.0.0/16'
        }
    ]
}
```
