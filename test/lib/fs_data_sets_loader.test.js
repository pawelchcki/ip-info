const { expect } = require('chai');
const { FSDataSetsLoader } = require('../../lib/fs_data_sets_loader');

const exampleNonExistingFsSourcedir = '../fixtures/this_doesnot_exists';

describe('FSDataSetsLoader', () => {
  context('loading from example source dir', () => {
    const sourceDir = `${__dirname}/../fixtures/example_fs_source`;

    it('Loads all files', (done) => {
      const loader = new FSDataSetsLoader(sourceDir);
      loader.load().toArray().subscribe((datasets) => {
        expect(datasets).deep.to.have.same.members([
          {
            contents: "1.1.1.1\n2.2.2.2\n# comment\n\n# empty line and comment",
            dataSet: "source_a.ipset",
          },
          {
            contents: "1.1.0.0/16",
            dataSet: "source_a.netset",
          },
          {
            contents: "3.3.3.3",
            dataSet: "nested_folder_a/source_b.ipset",
          },
          {
            contents: "4.4.4.4\n5.5.5.5",
            dataSet: "nested_folder_a/subnested_folder_a/source_c.ipset",
          },
          {
            contents: "4.4.0.0/16\n5.5.5.0/24",
            dataSet: "nested_folder_a/subnested_folder_a/source_c.netset"
          }
        ]);
      }, null, done);
    });
  });

  context('Empty source dir', () => {
    const sourceDir = `${__dirname}/../fixtures/example_empty_fs_source`;

    it('Loads no files', (done) => {
      const loader = new FSDataSetsLoader(sourceDir);
      loader.load().toArray().subscribe((datasets) => {
        expect(datasets).to.eql([]);
      }, null, done);
    });
  });


  context('Not existing dir', () => {
    const sourceDir = `${__dirname}/../fixtures/this_doesnot_exists`;

    it('Raises an error', (done) => {
      const loader = new FSDataSetsLoader(sourceDir);
      loader.load().toArray().subscribe(null, (err) => {
        expect(err).to.be.instanceOf(Error);
        done();
      }, null);
    });
  });
});
