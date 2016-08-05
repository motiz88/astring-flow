# astring-flow
[![circle][circle-image]][circle-url]
[![npm][npm-image]][npm-url]
[![coverage][coverage-image]][coverage-url]

[![semantic release][semantic-release-image]][semantic-release-url]
[![js-semistandard-style][semistandard-image]][semistandard-url]
[![MIT License][license-image]][license-url]

Flow AST types for [Astring][astring-url]

```javascript
var astring = require('astring');
var flowGenerator = require('astring-flow');
var code = astring(astWithTypes, {
    generator: flowGenerator
});
```

This is an early release. Use with caution. There will be changes (to be communicated via semver).

Until some of my changes and fixes to Astring make it upstream, this repo is built against my [fork](https://github.com/motiz88/astring) of Astring.  

[astring-url]: https://github.com/davidbonnet/astring
[circle-image]: https://img.shields.io/circleci/project/motiz88/astring-flow.svg?style=flat-square
[circle-url]: https://circleci.com/gh/motiz88/astring-flow
[npm-image]: https://img.shields.io/npm/v/astring-flow.svg?style=flat-square
[npm-url]: https://npmjs.org/package/astring-flow
[semantic-release-image]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square
[semantic-release-url]: https://github.com/semantic-release/semantic-release
[license-image]: http://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square
[license-url]: http://motiz88.mit-license.org/
[semistandard-image]: https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square
[semistandard-url]: https://github.com/Flet/semistandard
[coverage-image]: https://img.shields.io/codecov/c/github/motiz88/astring-flow.svg
[coverage-url]: https://codecov.io/gh/motiz88/astring-flow
