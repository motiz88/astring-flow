import baseGenerator from './es7Generator';
import { writeDelimitedList, writeCommaList } from './generatorHelpers';
import * as h from './flowHelpers';

const just = s => function (node, state) {
  const { output: o } = state;
  if (typeof s === 'function') {
    s = s.call(this, node, state);
  }
  o.write(s);
};

let FunctionDeclaration;

const next = Symbol('next');
const nextStr = Symbol('nextStr');
const nextMaybe = Symbol('nextMaybe');
const nextMaybeStr = Symbol('nextMaybeStr');

const flowGenerator = {
  ...baseGenerator,
  [next] (node, state) {
    if (!this[node.type]) {
      throw new Error(`Node type ${node.type} not implemented`);
    }
    this[node.type](node, state);
  },
  [nextStr] (prefix, node, state) {
    const { output: o } = state;
    o.write(prefix);
    this[next](node, state);
  },
  [nextMaybe] (node, state) {
    if (node) {
      this[next](node, state);
    }
  },
  [nextMaybeStr] (prefix, node, state) {
    if (node) {
      this[nextStr](prefix, node, state);
    }
  },
  ClassBody: baseGenerator.BlockStatement,
  AnyTypeAnnotation: just('any'),
  MixedTypeAnnotation: just('mixed'),
  VoidTypeAnnotation: just('void'),
  NumberTypeAnnotation: just('number'),
  NumberLiteralTypeAnnotation: just(node => node.raw || String(node.value)),
  StringTypeAnnotation: just('string'),
  StringLiteralTypeAnnotation: just(node => node.raw || String(node.value)),
  BooleanTypeAnnotation: just('boolean'),
  BooleanLiteralTypeAnnotation: just(node => node.raw || String(!!node.value)),
  TypeAnnotation ({ typeAnnotation }, state) {
    this[nextMaybeStr](': ', typeAnnotation, state);
  },
  NullableTypeAnnotation ({ typeAnnotation }, state) {
    this[nextMaybeStr]('?', typeAnnotation, state);
  },
  NullLiteralTypeAnnotation: just('null'),
  NullTypeAnnotation: just('null'),
  ThisTypeAnnotation: just('this'),
  ExistsTypeAnnotation: just('*'),
  FunctionTypeAnnotation (node, state) {
    const { mzChildNode, mzChildNodeArgs, ...restState } = state;
    const colonReturn = (mzChildNode === node && mzChildNodeArgs && mzChildNodeArgs.parentIsObjectTypeCallProperty);
    h.FunctionTypeAnnotation.call(this, node, restState, { colonReturn });
  },
  FunctionTypeParam ({ name, optional, typeAnnotation }, state) {
    const { output: o } = state;
    this[next](name, state);
    if (optional) o.write('?');
    this[next](typeAnnotation, state);
  },
  ArrayTypeAnnotation ({ elementType }, state) {
    const { output: o } = state;
    o.write('Array<');
    this[next](elementType, state);
    o.write('>');
  },
  ObjectTypeAnnotation ({ properties, indexers, callProperties, comments, trailingComments }, state) {
    const body = [...properties, ...indexers, ...callProperties];
    this.BlockStatement({ body, comments, trailingComments }, state);
  },
  ObjectTypeProperty ({ key, value, optional }, state) {
    const { output: o } = state;
    this[next](key, state);
    if (optional) o.write('?');
    o.write(': ');
    this[next](value, state);
    o.write(';');
  },
  ObjectTypeIndexer ({ id, key, value }, state) {
    const { output: o } = state;
    o.write('[');
    this[next](id, state);
    o.write(': ');
    this[next](key, state);
    o.write(']');
    o.write(': ');
    this[next](value, state);
  },
  ObjectTypeCallProperty ({ static_, value }, state) {
    const { output: o } = state;
    if (static_) o.write('static ');
    this[next](value, {...state, mzChildNode: value, mzChildNodeArgs: {parentIsObjectTypeCallProperty: true}});
  },
  QualifiedTypeIdentifier ({ qualification, id }, state) {
    const { output: o } = state;
    this[next](qualification, state);
    o.write('.');
    this[next](id, state);
  },
  GenericTypeAnnotation ({ id, typeParameters }, state) {
    this[next](id, state);
    this[nextMaybe](typeParameters, state);
  },
  MemberTypeAnnotation ({ object, property }, state) {
    throw new Error('FIXME: What is MemberTypeAnnotation?');
    /* const { output: o } = state;
    this[next](object, state);
    o.write('.');
    this[next](property, state); */
  },
  UnionTypeAnnotation ({ types }, state) {
    writeDelimitedList.call(this, ' | ', types, state);
  },
  IntersectionTypeAnnotation ({ types }, state) {
    writeDelimitedList.call(this, ' & ', types, state);
  },
  TypeofTypeAnnotation ({ argument }, state) {
    const { output: o } = state;
    o.write('typeof ');
    this[next](argument, state);
  },
  Identifier ({ typeAnnotation, ...node }, state) {
    baseGenerator.Identifier(node, state);
    this[nextMaybe](typeAnnotation, state);
  },
  TypeParameterDeclaration: h.TypeParameters,
  TypeParameterInstantiation: h.TypeParameters,
  TypeParameter ({ variance, name, bound }, state) {
    const { output: o } = state;
    switch (variance) {
      case 'plus':
        o.write('+');
        break;
      case 'minus':
        o.write('-');
        break;
    }
    o.write(name);
    this[nextMaybeStr](': ', bound, state);
  },
  FunctionDeclaration: FunctionDeclaration = function ({
    generator, id, params, body,
    returnType, typeParameters
  }, state) {
    const { output: o } = state;
    o.write(generator ? 'function* ' : 'function ');
    if (id) {
      o.write(id.name);
    }
    this[nextMaybe](typeParameters, state);
    o.write('(');
    writeCommaList.call(this, params, state);
    o.write(')');
    this[nextMaybeStr](': ', returnType, state);
    o.write(' ');
    this[next](body, state);
  },
  FunctionExpression: FunctionDeclaration,
  ClassProperty ({ key, value, computed, static: static_, typeAnnotation }, state) {
    const { output: o } = state;
    if (static_) o.write('static ');
    if (computed) o.write('[');
    this[next](key, state);
    if (computed) o.write(']');
    this[nextMaybeStr](': ', typeAnnotation, state);
    if (value) {
      o.write(' = ');
      this[next](value, state);
    }
  },
  ClassDeclaration ({ id, superClass, implements: implements_, typeParameters, superTypeParameters, body }, state) {
    const { output: o } = state;
    o.write('class ');
    if (id) {
      o.write(id.name);
      this[nextMaybe](typeParameters, state);
      o.write(' ');
    }
    if (superClass) {
      o.write('extends ');
      this[next](superClass, state);
      this[nextMaybe](superTypeParameters, state);
      o.write(' ');
    }
    if (implements_ && implements_.length) {
      o.write('implements ');
      writeCommaList.call(this, implements_, state);
      o.write(' ');
    }
    this[next](body, state);
  },
  InterfaceDeclaration ({ id, extends_, typeParameters, body }, state) {
    const { output: o } = state;
    o.write('interface ');
    if (id) {
      o.write(id.name);
      this[nextMaybe](typeParameters, state);
      o.write(' ');
    }
    if (extends_) {
      o.write('extends ');
      writeCommaList.call(this, extends_, state);
      o.write(' ');
    }
    this[next](body, state);
  },
  DeclareInterface (node, state) {
    const { output: o } = state;
    o.write('declare ');
    this.InterfaceDeclaration(node, state);
  },
  ClassImplements ({ typeParameters, ...node }, state) {
    baseGenerator.ClassImplements(node, state);
    this[nextMaybe](typeParameters, state);
  },
  InterfaceExtends (node, state) {
    this.ClassImplements(node, state);
  },
  TypeAlias ({ id, typeParameters, right }, state) {
    const { output: o } = state;
    o.write('type ');
    this[next](id, state);
    this[nextMaybe](typeParameters, state);
    o.write(' = ');
    this[next](right, state);
    o.write(';');
  },
  DeclareTypeAlias (node, state) {
    const { output: o } = state;
    o.write('declare ');
    this.TypeAlias(node, state);
  },
  TypeCastExpression ({ expression, typeAnnotation }, state) {
    const { output: o } = state;
    o.write('(');
    this[next](expression, state);
    o.write(': ');
    this[next](typeAnnotation, state);
    o.write(')');
  },
  TupleTypeAnnotation ({ types }, state) {
    const { output: o } = state;
    o.write('[');
    writeCommaList.call(this, types, state);
    o.write(']');
  },
  DeclareVariable (node, state) {
    const { output: o } = state;
    o.write('declare ');
    h.DeclareVariable.call(this, node, state);
  },
  DeclareFunction (node, state) {
    const { output: o } = state;
    o.write('declare ');
    h.DeclareFunction.call(this, node, state);
  },
  DeclareClass (node, state) {
    const { output: o } = state;
    o.write('declare ');
    h.DeclareClass.call(this, node, state);
  },
  DeclareModule ({ id, body }, state) {
    const { output: o } = state;
    o.write('declare module ');
    this[next](id, state);
    o.write(' ');
    this[next](body, state);
  },
  DeclareExportDeclaration ({ default: default_, declaration, specifiers, source }, state) {
    const { output: o } = state;
    o.write('declare export ');
    if (default_) {
      o.write('default ');
    }
    if (declaration) {
      switch (declaration.type) {
        case 'DeclareVariable':
          h.DeclareVariable.call(this, declaration, state);
          break;
        case 'DeclareFunction':
          h.DeclareFunction.call(this, declaration, state);
          break;
        case 'DeclareClass':
          h.DeclareClass.call(this, declaration, state);
          break;
        default:
          if (!default_) { // anything else implies default
            o.write('default ');
          }
          this[next](declaration, state);
      }
    } else {
      if (!default_) o.write('{');
      if (specifiers.length > 0) {
        for (let i = 0; ;) {
          const specifier = specifiers[i];
          if (specifier.type === 'ExportBatchSpecifier') {
            o.write('*');
          } else {
            const name = specifier.id.name;
            o.write(name);
            if (specifier.name && name !== specifier.name.name) {
              o.write(' as ' + specifier.name.name);
            }
          }
          if (++i < specifiers.length) {
            o.write(', ');
          } else {
            break;
          }
        }
      }
      if (!default_) o.write('}');
      if (source) {
        o.write(' from ');
        this[next](source, state);
      }
      o.write(';');
    }
  },
  DeclareModuleExports ({ typeAnnotation }, state) {
    const { output: o } = state;
    o.write('declare module.exports');
    this[nextMaybe](typeAnnotation, state);
    o.write(';');
  }
};

export default flowGenerator;
