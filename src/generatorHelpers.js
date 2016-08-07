import { next } from './generatorSymbols';

function writeDelimitedList (delimiter, list, state, first = true) {
  const { output: o } = state;
  for (const item of list) {
    if (!first) {
      o.write(delimiter);
    }
    this[next](item, state);
    first = false;
  }
  return first;
}

function writeCommaList (list, state, first = true) {
  return writeDelimitedList.call(this, ', ', list, state, first);
}

function writeDelimitedListWithParensRule (delimiter, list, needParens, state, first = true) {
  const { output: o } = state;
  for (const item of list) {
    if (!first) {
      o.write(delimiter);
    }
    const parens = needParens(item);
    if (parens) o.write('(');
    this[next](item, state);
    if (parens) o.write(')');
    first = false;
  }
  return first;
}

export { writeDelimitedList, writeCommaList, writeDelimitedListWithParensRule };
