const IPRouter = require('ip-router');

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
  constructor(source){
    this.sourcec = source;
  }
  build() {
    const routerBuilder = new RouterBuilder();

    return this.source.do(item => routerBuilder.addDestinationRoute(item))
      .takeLast()
      .map(() => routerBuilder.build());
  }
}

module.exports.RouterFactory = RouterFactory;
