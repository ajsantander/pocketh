const cli = require('../utils/cli.js');

test('Result should be 0', async () => {
  let result = await cli('selectors', './test/artifacts/Test.json', '0');
  expect(result.code).toBe(0);
});
