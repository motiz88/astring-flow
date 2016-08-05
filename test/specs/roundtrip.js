import path from 'path';
import fs from 'mz/fs';
import glob from 'glob';
import { parse } from 'flow-parser';
import astring from 'astring';
import flowGenerator from '../../src';
import normalizeNewline from 'normalize-newline';

const unsupportedNodes = ['JSXElement', 'AwaitExpression'];

describe('roundtrip', () => {
  for (const filename of glob.sync(path.resolve(__dirname, '..', 'data', 'roundtrip', '**', '*.js'))) {
    const basename = path.basename(filename);
    describe(basename, () => {
      const src = normalizeNewline(fs.readFileSync(filename, 'utf8'));
      const ast = parseFlow(src);
      if (some(
        depthFirstVisit({ value: ast }),
        ({ value, key }) =>
          key === 'type' && typeof value === 'string' &&
          unsupportedNodes.indexOf(value) !== -1
      )) {
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

function some (collection, fn) {
  for (const value of collection) {
    if (fn(value)) return true;
  }
  return false;
}

function * depthFirstVisit ({ value, key = null }) {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; ++i) {
      yield * depthFirstVisit({ value: value[i], key: i });
    }
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      yield * depthFirstVisit({ value: child, key });
    }
  }
  yield { value, key };
}
