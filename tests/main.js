const expect = require('unexpected')
const Config = require('..')


{
  process.env.CONFIGTEST_VALUE = 'something'

  const expectedConfig = {value: 'something'}
  const config = new Config()
  config.loadEnvironment({prefix: 'CONFIGTEST_'})
  delete process.env.CONFIGTEST_VALUE

  expect(config.object, 'to equal', expectedConfig)
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
  const config = new Config()
  config.loadEnvironment({prefix: 'CONFIGTEST_'})
  delete process.env.CONFIGTEST_OBJECT__WITH__SUB_FIELDS

  expect(config.object, 'to equal', expectedConfig)
}

{
  const tempArgv = process.argv
  process.argv.push(
    '--sub-fields', 'value',
    '--verbose',
    '--foo', 'bar'
  )

  const expectedConfig = {
    'sub-fields': 'value',
    subFields: 'value',
    verbose: true,
    foo: 'bar',
  }
  const config = new Config()
  config.loadCliArguments()

  process.argv = tempArgv

  expect(config.object, 'to equal', expectedConfig)
}

{
  const expectedConfig = {
    additionalSetting: 'additionalValue',
  }
  const config = new Config()
  config.loadFile({relativePath: '.no-default-name.yaml'})

  expect(config.object, 'to equal', expectedConfig)
}

{
  const expectedConfig = {
    justASetting: 'value',
    anotherSetting: 'this is an override value',
    thisSettingIsOnlyLocal: 'and has a value',
  }
  const config = new Config({appName: 'testApp'})
  config.loadDefaultFiles()

  expect(config.object, 'to equal', expectedConfig)
}

{
  const configA = {
    justASetting: 'value',
    anotherSetting: 'this is an override value',
  }
  const configB = {
    thirdSetting: 'foo',
    fourthSetting: 'bar',
  }
  const config = new Config()
    .merge(configA)
    .merge(configB)

  expect(config.object, 'to equal', Object.assign({}, configA, configB))
}
