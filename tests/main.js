const expect = require('unexpected')
const Config = require('..')


{
  process.env.CONFIGTEST_VALUE = 'something'

  const expectedConfig = {value: 'something'}
  const config = new Config()
  config.loadEnvironment({prefix: 'CONFIGTEST_'})

  expect(config.object, 'to equal', expectedConfig)

  delete process.env.CONFIGTEST_VALUE
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

  expect(config.object, 'to equal', expectedConfig)

  delete process.env.CONFIGTEST_OBJECT__WITH__SUB_FIELDS
}

{
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

  expect(config.object, 'to equal', expectedConfig)
}
