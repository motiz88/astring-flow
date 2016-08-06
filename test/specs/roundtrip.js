import path from 'path';
import fs from 'mz/fs';
import glob from 'glob';
import { parse } from 'flow-parser';
import astring from 'astring';
import flowGenerator from '../../src';
import normalizeNewline from 'normalize-newline';
import anyNodesAre from '../utils/anyNodesAre';

const unsupportedNodes = ['JSXElement', 'AwaitExpression'];

describe('roundtrip', () => {
  for (const filename of glob.sync(path.resolve(__dirname, '..', 'data', 'roundtrip', '**', '*.js'))) {
    const basename = path.basename(filename);
    describe(basename, () => {
      const src = normalizeNewline(fs.readFileSync(filename, 'utf8'));
      const ast = parseFlow(src);
      if (anyNodesAre(ast, unsupportedNodes)) {
        return;
      }
      it('result should parse', () => {
        const result = generate(ast);
        parseFlow(result);
      });
      // it('result should parse identically to source', () => {
      //   const result = generate(ast);
      //   parseFlow(result).should.deep.equal(ast);
      // });
    });
  }
});

function parseFlow (src) {
  return parse(src, {
    esproposal_class_static_fields: true,
    esproposal_class_instance_fields: true
  });
}

function generate (ast) {
  return astring(ast, {generator: flowGenerator, indent: '  '});
}

