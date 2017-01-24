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
