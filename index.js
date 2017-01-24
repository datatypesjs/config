const merge = require('deepmerge')
// const yargsParser = require('yargs-parser')

module.exports = class Config {
  constructor (options = {}) {
    Object.assign(this, options)
    this._config = {}

    this.env = {
      prefix: '',
      pathSeparator: '__',
      wordSeparator: '_',
      casing: 'camel',
    }
  }

  loadEnvironment (options = {}) {
    Object.assign(this.env, options)

    const environment = Object.assign({}, process.env)
    Object
      .keys(environment)
      .forEach(envVar => {
        if (!envVar.startsWith(this.env.prefix)) return

        const envVarNoPrefix = envVar.replace(this.env.prefix, '')
        const fields = envVarNoPrefix.split(this.env.pathSeparator)
        const object = {}
        let temp = object

        fields.forEach((field, index) => {
          field = field.toLowerCase()

          if (this.env.casing === 'camel') {
            field = field.replace(
              /\_(.)/g,
              (match, firstChar) => firstChar.toUpperCase()
            )
          }
          else {
            throw new Error(`"${this.env.casing}" is not supported`)
          }

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
