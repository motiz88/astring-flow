import types from '../utils/ast-types';

export default function anyNodesAre (ast, nodeTypes) {
  if (!nodeTypes.length) return false;
  let found = false;
  const visitFunc = function (path) {
    found = true;
    this.abort();
  };
  const visitor = Object.assign(...nodeTypes.map(type => ({
    ['visit' + type]: visitFunc
  })));
  types.visit(ast, visitor);
  return found;
}
