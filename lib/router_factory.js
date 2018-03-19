const IPRouter = require('ip-router');
const { Observable } = require('rxjs');

function filterCommentsAndEmptyLines(line) {
  return !line.match('.*#.*') && line !== '';
}

class RouterBuilder {
  constructor() {
    this.router = new IPRouter();
  }

  build() {
    return this.router;
  }

  addDestinationRoute({ dataSet, contents }) {
    contents.split("\n")
      .filter(filterCommentsAndEmptyLines)
      .forEach(line => this.router.insert(line, dataSet));
  }
}

class RouterFactory {
  constructor(source) {
    this.source = source;
    this.build = Observable.bindCallback(this.buildCallback);
  }

  buildCallback(callback) {
    const routerBuilder = new RouterBuilder();
    this.source
      .subscribe(
        item => routerBuilder.addDestinationRoute(item),
        null,
        () => callback(routerBuilder.build())
      );
  }
}

module.exports.RouterFactory = RouterFactory;
