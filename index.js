const fs = require('fs')
const path = require('path')
const assignDeep = require('assign-deep')
const yargsParser = require('yargs-parser')
const yaml = require('js-yaml')
const untildify = require('untildify')
const dataUriToBuffer = require('data-uri-to-buffer')


module.exports = class Config {
  constructor (options = {}) {
    const defaults = {
      config: {},
      appName: '',
    }
    assignDeep(this, defaults, options)
  }

  static fromConfigObject (object) {
    if (typeof object !== 'object') {
      throw new TypeError(
        `Type of argument must be object and not "${typeof object}"`
      )
    }
    return new Config()
      .merge(object)
  }

  get clone () {
    return new Config()
      .merge(this.config)
  }

  setAppName (appName) {
    this.appName = appName
    return this
  }

  loadEnvironment (options = {}) {
    const {
      encodeDataUris = true,
      prefix = this.appName
        ? this.appName.toUpperCase() + '_'
        : '',
      pathSeparator = '__',
      wordSeparator = '_',
      casing = 'camel',
    } = options

    Object
      .keys(process.env)
      .forEach(envVar => {
        if (!envVar.startsWith(prefix)) return

        const envVarNoPrefix = envVar.replace(prefix, '')
        const fields = envVarNoPrefix.split(pathSeparator)
        const object = {}
        let temp = object

        fields.forEach((field, index) => {
          field = field.toLowerCase()

          if (casing === 'camel') {
            field = field.replace(
              new RegExp(`\\${wordSeparator}(.)`, 'g'),
              (match, firstChar) => firstChar.toUpperCase()
            )
          }
          else {
            throw new Error(`"${casing}" is not supported`)
          }

          let envValue = process.env[envVar]

          if (encodeDataUris) {
            try {
              envValue = dataUriToBuffer(process.env[envVar])
                .toString()
            }
            catch (error) {
              if (!error.message.includes('not appear to be a Data URI')) {
                throw error
              }
            }
          }

          temp[field] = index === fields.length - 1
            ? envValue
            : {}
          temp = temp[field]
        })

        assignDeep(this.config, object)
      })

    return this
  }

  loadCliArguments () {
    const args = yargsParser(process.argv.slice(2))
    delete args._
    assignDeep(this.config, args)
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

    assignDeep(this.config, configObject)
    return this
  }

  loadDefaultFiles () {
    const baseFilePaths = [
      `~/.${this.appName}`,
      `~/.${this.appName}/config`,
      `~/.${this.appName}/${this.appName}`,
      `~/.config/${this.appName}/config`,
      `~/.config/${this.appName}/${this.appName}`,
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
        if (
          !error.message.includes('no such file') &&
          !error.message.includes('illegal operation on a directory')
        ) throw error
      }
    })

    return this
  }

  merge (configObject) {
    assignDeep(this.config, configObject)
    return this
  }

  toJSON () {
    return this.config
  }

  toString () {
    return JSON
      .stringify(this.config)
      .replace(/"/g, '')
  }
}
