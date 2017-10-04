const expect = require('unexpected')
const Config = require('..')

{
  console.info('- It reads config values from environment')
  process.env.CONFIGTEST_VALUE = 'something'

  const expectedConfig = {value: 'something'}
  const testConfig = new Config()
  testConfig.loadEnvironment({prefix: 'CONFIGTEST_'})
  delete process.env.CONFIGTEST_VALUE

  expect(testConfig.config, 'to equal', expectedConfig)
}

{
  console.info('- It reads nested config values from environment')
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
  console.info('- It reads base64 encoded config values from environment')
  process.env.CONFIGTEST_VALUE =
    'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ%3D%3D'

  const expectedConfig = {value: 'Hello, World!'}
  const testConfig = new Config()
  testConfig.loadEnvironment({prefix: 'CONFIGTEST_'})
  delete process.env.CONFIGTEST_VALUE

  expect(testConfig.config, 'to equal', expectedConfig)
}

{
  console.info('- It reads config from CLI arguments')
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
  console.info('- It reads config from additional file')
  const expectedConfig = {
    additionalSetting: 'additionalValue',
  }
  const testConfig = new Config()
  testConfig.loadFile({relativePath: '.no-default-name.yaml'})

  expect(testConfig.config, 'to equal', expectedConfig)
}

{
  console.info('- It reads config from JavaScript file')
  const expectedConfig = {
    somePath: '/Path/to/some/dir/file.txt',
  }
  const testConfig = new Config()
  testConfig
    .loadFile({relativePath: '.dynamicConfig.js'})

  expect(testConfig.config, 'to equal', expectedConfig)
}

{
  console.info('- It reads configs from default files')
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
  console.info('- It merges additional user specified configs')
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
  console.info('- It constructs config from config object')
  const testConfigObject = {
    justASetting: 'value',
    anotherSetting: 'another value',
  }
  const testConfig = Config.fromConfigObject(testConfigObject)

  expect(testConfig.config, 'to equal', Object.assign({}, testConfigObject))
}

{
  console.info('- It clones a config instance')
  const testConfigObject = {
    justASetting: 'value',
    anotherSetting: 'another value',
  }
  const testConfig = Config.fromConfigObject(testConfigObject)
  const testConfigClone = testConfig.clone
  testConfig.merge({justASetting: 'overwrite value'})

  expect(testConfigClone.config, 'to equal', testConfigObject)
}

{
  console.info('- It ignores error when loading non existant optional file')
  const testConfig = new Config()

  const loadOptions = {
    relativePath: 'does-not-exist.yaml',
  }
  testConfig.loadFile(loadOptions)
}

{
  console.info('- It throws error when loading non existant required file')
  const testConfig = new Config()

  const loadOptions = {
    relativePath: 'does-not-exist.yaml',
    isRequired: true,
  }
  function runTest () {
    return testConfig.loadFile(loadOptions)
  }

  expect(runTest, 'to throw error')
}


{
  console.info('- It throw error when loading directory')
  const path = require('path')
  const testConfig = new Config()
  const filePath = path.resolve('.')

  function runTest () {
    testConfig.loadFile({
      absolutePath: filePath,
      isRequired: true,
    })
  }

  expect(runTest, 'to throw error')
}

{
  console.info('- It ignores error when loading directory')
  const path = require('path')
  const testConfig = new Config()
  const filePath = path.resolve('.')

  testConfig.loadFile({
    absolutePath: filePath,
    ignoreIsDirectoryError: true,
  })
}

{
  console.info('- It replaces file path values with their file content')
  const testConfig = new Config()
  testConfig
    .merge({
      '@fileContent': './testSecret.txt',
    })
    .loadFilePathValues()
}
