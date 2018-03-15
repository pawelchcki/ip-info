const { expect } = require('chai');
const { IpSafeService } = require('../../services/ip_safe_service');
const IPRouter = require('ip-router');

describe('IpSaveService', () => {
  var router;
  var subject;
  const checkedIp = '1.2.3.4';

  beforeEach(() => {
    router = new IPRouter();
    subject = new IpSafeService(router);
  });

  context('Checked IP is blacklisted by specific IP', () => {
    const blacklistFileName = 'someblacklist.iplist';

    beforeEach(() => {
      router.insert(checkedIp, blacklistFileName);
    });

    it('marks the IP as not safe and returns rejection reason', () => {
      expect(subject.handle({ ip: checkedIp })).to.eql(
        {
          safe: false,
          rejected_by: [
            {
              source: blacklistFileName,
              rule: `${checkedIp}/32`
            }
          ]
        });
    });
  });
  context('Checked IP is blacklisted by netblock', () => {
    const blacklistFileName = 'someblacklist.netset';
    const blackListNetblock = '1.2.0.0/16';

    beforeEach(() => {
      router.insert(blackListNetblock, blacklistFileName);
    });

    it('marks the IP as not safe and returns rejection reason', () => {
      expect(subject.handle({ ip: checkedIp })).to.eql(
        {
          safe: false,
          rejected_by: [
            {
              source: blacklistFileName,
              rule: blackListNetblock
            }
          ]
        });
    });

    context('Checked IP is blacklisted by additional specific IP', () => {
      const otherBlacklistFileName = 'someblacklist.ipset';
      beforeEach(() => {
        router.insert(checkedIp, otherBlacklistFileName);
      });
      it('marks the IP as not safe and returns rejection reason', () => {
        expect(subject.handle({ ip: checkedIp })).to.eql(
          {
            safe: false,
            rejected_by: [
              {
                source: otherBlacklistFileName,
                rule: `${checkedIp}/32`
              },
              {
                source: blacklistFileName,
                rule: blackListNetblock
              }
            ]
          });
      });
    });
  });

  context('Checked IP is not blacklisted', () => {
    it('marks the IP as safe', () => {
      expect(subject.handle({ ip: checkedIp })).to.eql({ safe: true });
    });
  });
});