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
    return dataSet;
  }
}

class RouterFactory {
  buildRouter(source) {
    const routerBuilder = new RouterBuilder();

    source.subscribe((item) => routerBuilder.addDestinationRoute(item));
    return source.last().map(() => routerBuilder.build());
  }
}

module.exports.RouterFactory = RouterFactory;