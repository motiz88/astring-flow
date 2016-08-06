import types from 'ast-types';

const { Type: { def } } = types;

def('DeclareModuleExports')
  .bases('Statement')
    .build('typeAnnotation')
    .field('typeAnnotation', def('TypeAnnotation'));
types.finalize();

export default types;
