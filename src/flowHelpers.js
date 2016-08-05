import { writeCommaList } from './generatorHelpers';
import flowGenerator from './flowGenerator';

function FunctionTypeAnnotation ({ typeParameters, params, rest, returnType }, state, { colonReturn } = {}) {
  const { output: o } = state;
  if (typeParameters) {
    this[typeParameters.type](typeParameters, state);
  }
  o.write('(');
  const anyParams = writeCommaList.call(this, params, state);
  if (rest) {
    writeCommaList.call(this, [rest], state, anyParams);
  }
  o.write(')');

  if (colonReturn) {
    o.write(': ');
  } else {
    o.write(' => ');
  }
  this[returnType.type](returnType, state);
}

function DeclareVariable ({ id }, state) {
  const { output: o } = state;
  o.write('var ');
  this[id.type](id, state);
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
    this[id.type](id, state);
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

export { FunctionTypeAnnotation, DeclareVariable, DeclareFunction, DeclareClass };
