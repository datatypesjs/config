const fs = require('fs')
const path = require('path')
const merge = require('deepmerge')
const yargsParser = require('yargs-parser')
const yaml = require('js-yaml')
const untildify = require('untildify')


module.exports = class Config {
  constructor (options = {}) {
    Object.assign(this, options)
    this._config = {}

    this.env = {
      prefix: this.appName
        ? this.appName.toUpperCase() + '_'
        : '',
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

    return this
  }

  loadCliArguments () {
    const args = yargsParser(process.argv.slice(2))
    delete args._
    this._config = merge(this._config, args)
    return this
  }

  loadFile (options = {}) {
    const {
      absolutePath,
      relativePath,
    } = options

    const filePath = absolutePath || path.resolve(relativePath)
    const fileExtension = path
      .extname(filePath)
      .slice(1)
    const fileContent = fs.readFileSync(filePath)
    let configObject

    if (fileExtension === 'json' || fileExtension === '') {
      configObject = JSON.parse(fileContent)
    }
    else if (fileExtension === 'yaml') {
      configObject = yaml.safeLoad(fileContent)
    }
    else {
      throw new TypeError(`"${fileExtension}" is no supported file extension`)
    }

    this._config = merge(this._config, configObject)
    return this
  }

  loadDefaultFiles () {
    const baseFilePaths = [
      `~/.${this.appName}`,
      `~/.${this.appName}/config`,
      `~/.${this.appName}/${this.appName}`,
      `~/.config/${this.appName}/config`,
      `~/.config/${this.appName}/${this.appName}`,
      // '/**/.myapp',
    ]
    let currentPath = ''
    process
      .cwd()
      .split(path.sep)
      .forEach(segment => {
        currentPath += segment + path.sep
        baseFilePaths.push(currentPath + '.' + this.appName)
      })

    const filePaths = baseFilePaths
      .reduce(
        (paths, filePath) => {
          paths.push(filePath, `${filePath}.json`, `${filePath}.yaml`)
          return paths
        },
        []
      )
      .map(filePath => path.normalize(filePath))

    filePaths.forEach(filePath => {
      // console.log(untildify(filePath))
      try {
        this.loadFile({absolutePath: untildify(filePath)})
      }
      catch (error) {
        if (!error.message.includes('no such file')) throw error
      }
    })

    return this
  }

  get object () {
    return this._config
  }

  toJSON () {
    return this.object
  }

  toString () {
    return JSON
      .stringify(this.object)
      .replace(/"/g, '')
  }
}
