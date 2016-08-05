function writeDelimitedList (delimiter, list, state, first = true) {
  for (const item of list) {
    if (!first) {
      state.output.write(delimiter);
    }
    this[item.type](item, state);
    first = false;
  }
  return first;
}

function writeCommaList (list, state, first = true) {
  return writeDelimitedList.call(this, ', ', list, state, first);
}

export { writeDelimitedList, writeCommaList };
