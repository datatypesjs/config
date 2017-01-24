const expect = require('unexpected')
const expectedConfig = {
  value: 'something',
}

process.env.CONFIGTEST_VALUE = 'something'


const Config = require('..')
const config = new Config({
  envPrefix: 'CONFIGTEST_',
})

config
  .loadEnvironment()

expect(config.object, 'to equal', expectedConfig)
