const merge = require('deepmerge')
// const yargsParser = require('yargs-parser')

module.exports = class Config {
  constructor (options = {}) {
    Object.assign(this, options)
    this._config = {}
  }

  loadEnvironment () {
    const environment = Object.assign({}, process.env)
    Object
      .keys(environment)
      .forEach(envVar => {
        if (!envVar.startsWith(this.envPrefix)) return
        const envVarNoPrefix = envVar.replace(this.envPrefix, '')
        const fields = envVarNoPrefix.split('__')
        const object = {}
        let temp = object
        fields.forEach((field, index) => {
          field = field.toLowerCase()
          temp[field] = index === fields.length - 1
            ? environment[envVar]
            : {}
          temp = temp[field]
        })
        this._config = merge(this._config, object)
      })
  }

  // loadArgv () {
  //   const cliArgs = process.argv.slice(2)
  // }

  get object () {
    return this._config
  }
}
