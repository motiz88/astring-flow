import baseGenerator from './es7Generator';
import { writeCommaList, writeDelimitedListWithParensRule } from './generatorHelpers';
import * as h from './flowHelpers';
import { next, nextStr, nextMaybe, nextMaybeStr } from './generatorSymbols';
import assert from 'assert';
import jsStringEscape from 'js-string-escape';

const just = s => function (node, state) {
  const { output: o } = state;
  let result;
  if (typeof s === 'function') {
    result = s.call(this, node, state);
  } else {
    result = s;
  }
  o.write(result);
};

let FunctionDeclaration;

const flowGenerator = {
  ...baseGenerator,
  [next] (node, state) {
    assert(typeof node === 'object' && node && node.type, `not a node: ${node}`);
    if (!this[node.type]) {
      throw new Error(`Node type ${node.type} not implemented`);
    }
    this[node.type](node, state);
  },
  [nextStr] (prefix, node, state) {
    assert(typeof prefix === 'string', `not a prefix: ${prefix}`);
    assert(typeof node === 'object' && node && node.type, `not a node: ${node}`);
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
  StringLiteralTypeAnnotation: just(node => {
    return node.raw || jsStringEscape(node.value);
  }),
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
    const colonReturn = (mzChildNode === node && mzChildNodeArgs && mzChildNodeArgs.colonReturn);
    h.FunctionTypeAnnotation.call(this, node, restState, { colonReturn });
  },
  FunctionTypeParam ({ name, optional, typeAnnotation }, state) {
    const { output: o } = state;
    this[next](name, state);
    if (optional) o.write('?');
    this[nextMaybeStr](': ', typeAnnotation, state);
  },
  ArrayTypeAnnotation ({ elementType }, state) {
    const { output: o } = state;
    const parens = [
      'ObjectTypeAnnotation',
      'UnionTypeAnnotation',
      'IntersectionTypeAnnotation',
      'FunctionTypeAnnotation',
      'TypeofTypeAnnotation'
    ].indexOf(elementType.type) !== -1;
    if (parens) o.write('(');
    this[next](elementType, state);
    if (parens) o.write(')');
    o.write('[]');
  },
  ObjectTypeAnnotation ({ properties, indexers, callProperties, comments, trailingComments }, state) {
    const body = [...properties, ...indexers, ...callProperties];
    this.BlockStatement({ body, comments, trailingComments }, state);
  },
  ObjectTypeProperty ({ key, value, optional }, state) {
    const { output: o } = state;
    this[next](key, state);
    if (!optional && typeof value === 'object' && value && value.type === 'FunctionTypeAnnotation') {
      this[next](value, {...state, mzChildNode: value, mzChildNodeArgs: {colonReturn: true}});
    } else {
      if (optional) o.write('?');
      o.write(': ');
      this[next](value, state);
    }
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
    o.write(';');
  },
  ObjectTypeCallProperty ({ static: static_, value }, state) {
    const { output: o } = state;
    if (static_) o.write('static ');
    this[next](value, {...state, mzChildNode: value, mzChildNodeArgs: {colonReturn: true}});
    o.write(';');
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
    writeDelimitedListWithParensRule.call(this, ' | ', types,
      node => ['FunctionTypeAnnotation', 'IntersectionTypeAnnotation'].indexOf(node.type) !== -1,
      state);
  },
  IntersectionTypeAnnotation ({ types }, state) {
    writeDelimitedListWithParensRule.call(this, ' & ', types,
      node => ['FunctionTypeAnnotation', 'UnionTypeAnnotation'].indexOf(node.type) !== -1,
      state);
  },
  TypeofTypeAnnotation ({ argument }, state) {
    const { output: o } = state;
    o.write('typeof ');
    this[next](argument, state);
  },
  Identifier ({ typeAnnotation, optional, ...node }, state) {
    const { output: o } = state;
    baseGenerator.Identifier.call(this, node, state);
    if (optional) o.write('?');
    this[nextMaybe](typeAnnotation, state);
  },
  TypeParameterDeclaration: h.TypeParameters,
  TypeParameterInstantiation: h.TypeParameters,
  TypeParameter ({ variance, name, bound, default: default_ }, state) {
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
    this[nextMaybe](bound, state);
    this[nextMaybeStr](' = ', default_, state);
  },
  FunctionDeclaration: FunctionDeclaration = function ({
    generator, id, params, rest, body, defaults, async,
    returnType, typeParameters
  }, state) {
    const { output: o } = state;
    if (async) o.write('async ');
    o.write(generator ? 'function* ' : 'function ');
    if (id) {
      o.write(id.name);
    }
    h.functionSignature.call(this, { typeParameters, params, defaults, rest, returnType }, state, { colonReturn: true });
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
    this[nextMaybe](typeAnnotation, state);
    if (value) {
      o.write(' = ');
      this[next](value, state);
    }
    o.write(';');
  },
  ClassDeclaration ({ id, extends: extends_, superClass, implements: implements_, typeParameters, superTypeParameters, body }, state) {
    const { output: o } = state;
    o.write('class ');
    if (id) {
      o.write(id.name);
      this[nextMaybe](typeParameters, state);
      o.write(' ');
    }
    if (extends_ && extends_.length) {
      o.write('extends ');
      writeCommaList.call(this, extends_, state);
      o.write(' ');
    } else if (superClass) {
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
  InterfaceDeclaration ({ id, extends: extends_, typeParameters, body }, state) {
    const { output: o } = state;
    o.write('interface ');
    if (id) {
      o.write(id.name);
      this[nextMaybe](typeParameters, state);
      o.write(' ');
    }
    if (extends_ && extends_.length) {
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
    baseGenerator.ClassImplements.call(this, node, state);
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
      const isDefaultOrBatch = default_ || (
        specifiers.length === 1 &&
        specifiers[ 0 ].type === 'ExportBatchSpecifier'
      );
      if (!isDefaultOrBatch) o.write('{');
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
      if (!isDefaultOrBatch) o.write('}');
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
  },
  MethodDefinition ({ static: static_, kind, computed, generator, key, value }, state) {
    const { output: o } = state;
    if (static_) o.write('static ');
    switch (kind[0]) {
      case 'g': // `get`
      case 's': // `set`
        o.write(kind + ' ');
        break;
      default:
        break;
    }
    if (value.generator) o.write('*');
    if (computed) {
      o.write('[');
      this[next](key, state);
      o.write(']');
    } else {
      this[next](key, state);
    }
    const { typeParameters, params, defaults, rest, returnType } = value;
    h.functionSignature.call(this, { typeParameters, params, defaults, rest, returnType }, state, { colonReturn: true });
    o.write(' ');
    this[next](value.body, state);
  },
  ArrowFunctionExpression ({ async, typeParameters, params, defaults, rest, returnType, body }, state) {
    const { output: o } = state;
    if (async) o.write('async ');
    h.functionSignature.call(this, { typeParameters, params, defaults, rest, returnType }, state, { colonReturn: true });
    o.write(' => ');
    const parens = body.type === 'ObjectExpression';
    if (parens) o.write('(');
    this[next](body, state);
    if (parens) o.write(')');
  },
  ArrayExpression ({ elements }, state) {
    const { output: o } = state;
    o.write('[');
    elements.forEach((element, i) => {
      if (element) {
        this[next](element, state);
        if (i + 1 < elements.length) {
          o.write(', ');
        }
      }
    });
    o.write(']');
  }
};

export default flowGenerator;
