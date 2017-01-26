const expect = require('unexpected')
const Config = require('..')

{
  process.env.CONFIGTEST_VALUE = 'something'

  const expectedConfig = {value: 'something'}
  const testConfig = new Config()
  testConfig.loadEnvironment({prefix: 'CONFIGTEST_'})
  delete process.env.CONFIGTEST_VALUE

  expect(testConfig.config, 'to equal', expectedConfig)
}

{
  process.env.CONFIGTEST_OBJECT__WITH__SUB_FIELDS = 'another thing'

  const expectedConfig = {
    object: {
      with: {
        subFields: 'another thing',
      },
    },
  }
  const testConfig = new Config()
  testConfig.loadEnvironment({prefix: 'CONFIGTEST_'})
  delete process.env.CONFIGTEST_OBJECT__WITH__SUB_FIELDS

  expect(testConfig.config, 'to equal', expectedConfig)
}

{
  process.env.CONFIGTEST_VALUE =
    'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ%3D%3D'

  const expectedConfig = {value: 'Hello, World!'}
  const testConfig = new Config()
  testConfig.loadEnvironment({prefix: 'CONFIGTEST_'})
  delete process.env.CONFIGTEST_VALUE

  expect(testConfig.config, 'to equal', expectedConfig)
}

{
  const tempArgv = process.argv
  process.argv.push(
    '--sub-fields', 'value',
    '--verbose',
    '--dot-notation.for.paths',
    '--foo', 'bar'
  )

  const expectedConfig = {
    'sub-fields': 'value',
    subFields: 'value',
    verbose: true,
    // TODO: https://github.com/yargs/yargs-parser/issues/77
    'dot-notation': {for: {paths: true}},
    dotNotationForPaths: true,
    foo: 'bar',
  }
  const testConfig = new Config()
  testConfig.loadCliArguments()

  process.argv = tempArgv

  expect(testConfig.config, 'to equal', expectedConfig)
}

{
  const expectedConfig = {
    additionalSetting: 'additionalValue',
  }
  const testConfig = new Config()
  testConfig.loadFile({relativePath: '.no-default-name.yaml'})

  expect(testConfig.config, 'to equal', expectedConfig)
}

{
  const expectedConfig = {
    justASetting: 'value',
    anotherSetting: 'this value gets overwritten',
    thisSettingIsOnlyLocal: 'and has a value',
  }
  const testConfig = new Config({appName: 'testApp'})
  testConfig.loadDefaultFiles()

  expect(testConfig.config, 'to equal', expectedConfig)
}

{
  const testConfigA = {
    justASetting: 'value',
    anotherSetting: 'this value gets overwritten',
  }
  const testConfigB = {
    thirdSetting: 'foo',
    fourthSetting: 'bar',
  }
  const testConfig = new Config()
    .merge(testConfigA)
    .merge(testConfigB)

  expect(
    testConfig.config,
    'to equal',
    Object.assign({}, testConfigA, testConfigB)
  )
}

{
  const testConfigObject = {
    justASetting: 'value',
    anotherSetting: 'another value',
  }
  const testConfig = Config.fromConfigObject(testConfigObject)

  expect(testConfig.config, 'to equal', Object.assign({}, testConfigObject))
}

{
  const testConfigObject = {
    justASetting: 'value',
    anotherSetting: 'another value',
  }
  const testConfig = Config.fromConfigObject(testConfigObject)
  const testConfigClone = testConfig.clone
  testConfig.merge({justASetting: 'overwrite value'})

  expect(testConfigClone.config, 'to equal', testConfigObject)
}
