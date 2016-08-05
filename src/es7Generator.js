import { defaultGenerator as baseGenerator } from 'astring';

export default {
  ...baseGenerator,
  ClassProperty ({ key, value, computed, static: static_ }, state) {
    const { output: o } = state;
    if (static_) o.write('static ');
    if (computed) o.write('[');
    this[key.type](key, state);
    if (computed) o.write(']');
    o.write(' = ');
    this[value.type](value, state);
  },
  ClassImplements ({ id }, state) {
    this[id.type](id, state);
  },
  SpreadPropertyPattern ({ argument }, state) {
    const { output: o } = state;
    o.write('...');
    this[argument.type](argument, state);
  }
};
