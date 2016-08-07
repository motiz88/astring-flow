import types from '../utils/ast-types';
import toSingleQuotes from 'to-single-quotes';

function cloneNodeDeep (node, key) {
  if (!node) return node;
  if (typeof node === 'object' && node && node.type) {
    const copy = {};
    types.eachField(node, function (name, value) {
      // Note that undefined fields will be visited too, according to
      // the rules associated with node.type, and default field values
      // will be substituted if appropriate.
      copy[name] = cloneNodeDeep(value, name);
    });
    return copy;
  }
  if (Array.isArray(node)) {
    const copy = [];
    for (const value of node) {
      // Note that undefined fields will be visited too, according to
      // the rules associated with node.type, and default field values
      // will be substituted if appropriate.
      copy.push(cloneNodeDeep(value), copy.length);
    }
    return copy;
  }
  if (key === 'raw' && typeof node === 'string') {
    return toSingleQuotes(node);
  }
  if (typeof node === 'object') {
    return {...node};
  }
  return node;
}

export default function sanitizeAst (ast) {
  return cloneNodeDeep(ast);
}
