
class IpSafeService {
  constructor(router) {
    this.router = router;
  }

  findRoutes(ip) {
    return this.router.findRoutes(ip);
  }

  rejectionsFromRoutes(routes) {
    return routes.map((route) => {
      return {
        source: route.dest,
        rule: route.src,
      };
    });
  }

  responseForIp(ip) {
    const routes = this.findRoutes(ip);
    if (routes.length === 0) {
      return { safe: true };
    } else {
      const rejections = this.rejectionsFromRoutes(routes);
      return { safe: false, rejected_by: rejections };
    }
  }

  handle(request) {
    return this.responseForIp(request.ip);
  }
}

module.exports.IpSafeService = IpSafeService;