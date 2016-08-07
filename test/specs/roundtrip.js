import path from 'path';
import fs from 'mz/fs';
import glob from 'glob';
import { parse } from 'flow-parser';
import astring from 'astring';
import flowGenerator from '../../src';
import normalizeNewline from 'normalize-newline';
import anyNodesAre from '../utils/anyNodesAre';
import sanitizeAst from '../utils/sanitizeAst';
import deepEqual from 'deep-equal';
import { fail } from 'assert';

const unsupportedNodes = ['JSXElement', 'AwaitExpression'];

describe('roundtrip', () => {
  for (const filename of glob.sync(path.resolve(__dirname, '..', 'data', 'roundtrip', '**', '*.js'))) {
    const basename = path.basename(filename);
    describe(basename, () => {
      const fixtureSrc = normalizeNewline(fs.readFileSync(filename, 'utf8'));
      const fixtureAst = parseFlow(fixtureSrc);
      if (fixtureAst.errors.length) {
        return;
      }
      if (anyNodesAre(fixtureAst, unsupportedNodes)) {
        return;
      }
      let generatedSrc;

      before(() => {
        generatedSrc = generate(fixtureAst);
      });
      it('result should parse with no errors', () => {
        const generatedAst = parseFlow(generatedSrc);
        if (generatedAst.errors && generatedAst.errors.length) {
          fail({errors: generatedAst.errors, src: generatedSrc}, {errors: [], src: fixtureSrc}, 'Generated code has parse errors: ' + generatedSrc);
        }
      });
      it('result should parse identically to source', () => {
        const generatedAst = parseFlow(generatedSrc);

        const sanitizedGeneratedAst = sanitizeAst(generatedAst);
        const sanitizedFixtureAst = sanitizeAst(fixtureAst);

        // sanitizedGeneratedAst.should.deep.equal(sanitizedFixtureAst);
        if (!deepEqual(sanitizedGeneratedAst, sanitizedFixtureAst)) {
          fail({ast: sanitizedGeneratedAst, src: generatedSrc}, {ast: sanitizedFixtureAst, src: fixtureSrc}, 're-parsed AST differs from fixture AST');
        }
      });
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

