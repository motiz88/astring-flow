import { writeCommaList } from './generatorHelpers';
import flowGenerator from './flowGenerator';
import { next, nextMaybe, nextMaybeStr } from './generatorSymbols';

function FunctionTypeAnnotation ({ typeParameters, params, rest, returnType }, state, { colonReturn } = {}) {
  const { output: o } = state;
  this[nextMaybe](typeParameters, state);
  o.write('(');
  const first = writeCommaList.call(this, params, state);
  if (rest) {
    if (!first) {
      o.write(', ');
    }
    o.write('...');
    this[next](rest, state);
  }
  o.write(')');

  if (colonReturn) {
    o.write(': ');
  } else {
    o.write(' => ');
  }
  this[next](returnType, state);
}

function DeclareVariable ({ id }, state) {
  const { output: o } = state;
  o.write('var ');
  this[next](id, state);
  o.write(';');
}

function DeclareFunction ({ id }, state) {
  const { output: o } = state;
  o.write('function ');
  if (
    id.type === 'Identifier' &&
    id.typeAnnotation &&
    id.typeAnnotation.typeAnnotation &&
    id.typeAnnotation.typeAnnotation.type === 'FunctionTypeAnnotation' &&
    this.FunctionTypeAnnotation === flowGenerator.FunctionTypeAnnotation
  ) {
    o.write(id.name);
    FunctionTypeAnnotation.call(this, id.typeAnnotation.typeAnnotation, state, { colonReturn: true });
  } else {
    this[next](id, state);
  }
  o.write(';');
}

function DeclareClass (node, state) {
  this.ClassDeclaration(node, state);
}

export function TypeParameters ({ params }, state) {
  const { output: o } = state;
  if (params) {
    o.write('<');
    writeCommaList.call(this, params, state);
    o.write('>');
  }
}

export function functionSignature ({ typeParameters, params, defaults, rest, returnType }, state, { colonReturn = true } = { colonReturn }) {
  const { output: o } = state;
  this[nextMaybe](typeParameters, state);
  o.write('(');
  let first = true;
  for (let i = 0; i < params.length; ++i) {
    const param = params[i];
    if (!first) {
      o.write(', ');
    }
    this[next](param, state);
    if (Array.isArray(defaults)) {
      this[nextMaybeStr](' = ', defaults[i], state);
    }
    first = false;
  }
  if (rest) {
    if (!first) {
      o.write(', ');
    }
    o.write('...');
    this[next](rest, state);
  }
  o.write(')');
  if (returnType && returnType.typeAnnotation) {
    if (colonReturn) {
      o.write(': ');
    } else {
      o.write(' => ');
    }
    this[next](returnType.typeAnnotation, state);
  }
}
export { FunctionTypeAnnotation, DeclareVariable, DeclareFunction, DeclareClass };
