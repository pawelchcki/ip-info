const IPRouter = require('ip-router')
const router = new IPRouter()
const octokit = require('@octokit/rest')()
const util = require('util')

const { Observable, Subject, ReplaySubject } = require('rxjs');
const { map, filter, switchMap } = require('rxjs/operators');


octokit.authenticate({
    type: 'oauth',
    key: '44d59d68a4d4c361e03a',
    secret: '71a14ba38217cd4576b505600cdeace0ec21cfc8'
})

function addFileToRouter(router, path, file) {
    file.split("\n")
        .filter(l => !l.match('.*#.*') && l !== '')
        // .map(x => { console.log(x); return x })
        .forEach(line => router.insert(line, path))
    return path;
}

function fetchFile(sha) {
    return Observable.fromPromise(octokit.gitdata.getBlob({ owner: 'firehol', repo: 'blocklist-ipsets', sha: sha }))
        .map(b => Buffer.from(b.data.content, 'base64').toString('utf8'))
}

function processFile(router, path, fileObservable) {
    return fileObservable
        .map(f => { console.log(path); return f; })
        .map(fileContents => addFileToRouter(router, path, fileContents))
}

function loadFilesFromGH() {
    const tree = octokit.gitdata.getTree({ owner: 'firehol', sha: 'master', repo: 'blocklist-ipsets', recursive: true })
    return Observable.fromPromise(tree)

        .flatMap(e => e.data.tree)
        .filter(e => e.type === 'blob')
        .filter(e => e.path.match(/\.(ipset|netset)$/))
        .map(e => [e.path, fetchFile(e.sha)])
}

const testFolder = './blocklist-ipsets';
const fs = require('fs');


const filesInDir = Observable.bindNodeCallback(fs.readdir)
const statFile = Observable.bindNodeCallback(fs.stat)

//TODO: pasta from stack - too late to write from scratch
function listFiles(dir) {
    return file$ = filesInDir(`${dir}`)
        .flatMap(file => file)
        .filter(file => !file.startsWith('.'))
        .flatMap(file => statFile(`${dir}/${file}`)
            .map(sf => { return { file, isDir: sf.isDirectory() } }))
        .flatMap(f => {
            if (f.isDir) {
                return listFiles(`${dir}/${f.file}`)
            }
            return Observable.of(`${dir}/${f.file}`)
        })
}

const readFile = Observable.bindNodeCallback(fs.readFile)

function loadFilesFromFS() {
    let cnt = 0;
    return listFiles(testFolder)
        .filter(f => f.match(/\.(ipset|netset)$/))
        .map(f => f.replace(/^\.\//, ''))
        .map(f => [f.replace(testFolder, ''), readFile(f, 'utf-8')])
}

async function run() {
    const result = await octokit.misc.getRateLimit({})
    console.log(util.inspect(result['data']['resources']['core']))

    const k = loadFilesFromFS()        
        // .filter(([path, _]) => path.match(/pl/))
        // .take(100)
        .flatMap(([path, file]) => processFile(router, path, file), 20)
        .toArray()
    // .first()
    console.time('load')
    let a = await k.toPromise()
    console.timeEnd('load')
    for (let j = 0; j < 2; j++) {
        console.time(`start${j}`)
        let n = 100000;
        for (let i = 0; i < n; i++) {
            router.find('79.173.32.169')
        }

        console.timeEnd(`start${j}`)

    }
    console.log(a.length)
    console.log("end")
    console.log(util.inspect(router.findRoutes('79.173.32.169')))
    // console.log(util.inspect(router.toDict()))
}

run()

