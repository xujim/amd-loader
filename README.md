# amd-loader

A custom implementation of [amd.js](https://github.com/amdjs/amdjs-api/wiki/AMD).

This lib is an amd loader, and almostly has the same API with `require.js`. So it's the alternative for those who are familiar with amd module system.

The biggest intention is to have some insight into `require.js` and the `amd` module system. I read part of the `require.js`'s source code, so code here is surely affected. And also thanks for other blogs about *javascript module system*.

## APIs

View [amd.js](https://github.com/amdjs/amdjs-api/wiki/AMD) spec for details.

1. `define([[id, ]deps, ]factory)`

    Define a standard amd module.

2. `require(deps, callback)`

    Run callback after deps loaded.

## Test

Only normal usage case included here to test the lib, and test based on `karma`.

```bash
npm test
```

## License

[MIT](LICENSE)