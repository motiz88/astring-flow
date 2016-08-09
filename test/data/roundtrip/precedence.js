type A = (T | U)[];
type A2 = T | U[];
type B = (T & U)[];
type B2 = T & U[];
type C = (T | U) & (V | W);
type D = (T & U) | (V & W);
type E = (typeof T)[];
type F = ((x: X) => Y)[];
type G = (x: X) => Y[];
