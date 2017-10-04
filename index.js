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
      // filePath,
      absolutePath,
      relativePath,
      isRequired = false,
      ignoreIsDirectoryError = false,
      onSuccess = filePath => {},
    } = options
    const filePath =
      this.resolveFilePath(options.filePath || absolutePath || relativePath)
    const fileContent = this.getFileContent({filePath, isRequired})
    const configObject = this.getConfigObject({fileContent, filePath})

    assignDeep(this.config, configObject)

    try {
      onSuccess(filePath)
    } catch (error) { }

    return this
  }


  resolveFilePath (filePath) {
    if (filePath) {
      return path.resolve(filePath)
    }
    else {
      throw new Error('No file path was specified')
    }
  }


  getConfigObject ({fileContent, filePath}) {
    try {
      const fileExtension = path
        .extname(filePath)
        .slice(1)

      if (fileExtension === 'json' || fileExtension === '') {
        return JSON.parse(fileContent)
      }
      else if (fileExtension === 'js') {
        return require(filePath)
      }
      else if (fileExtension === 'yaml') {
        return yaml.safeLoad(fileContent)
      }
      else {
        throw new TypeError(`"${fileExtension}" is no supported file extension`)
      }
    }
    catch (error) {
      error.message =
        `Following error occurred while trying to load "${filePath}":\n` +
        error.message
      throw error
    }
  }


  getFileContent ({filePath, isRequired}) {
    try {
      return fs.readFileSync(filePath)
    }
    catch (error) {
      const notExistant = error.message.includes('no such file')
      const isDirectory = error.message
        .includes('illegal operation on a directory')

      if (isRequired && (ignoreIsDirectoryError || !isDirectory)) {
        throw new Error(`"${filePath}" is not a file`)
      }
      else {
        return '{}'
      }
    }
  }


  loadDefaultFiles (options = {}) {
    const {
      ignoreIsDirectoryError = true,
    } = options
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
      this.loadFile({
        absolutePath: untildify(filePath),
        ignoreIsDirectoryError,
      })
    })

    return this
  }

  loadFilePathValues (options = {}) {
    const {
      triggerCharater = '@',
      shouldTrim = true,
    } = options

    const thisInstance = this

    function resolve (key, value) {
      if (key.startsWith(triggerCharater) && typeof value === 'string') {
        const filePath = path.resolve(value)
        let fileContent = fs
          .readFileSync(filePath)
          .toString()

        if (shouldTrim) {
          fileContent = fileContent.trim()
        }

        thisInstance.config[key.slice(1)] = fileContent // Set key
        delete thisInstance.config[key] // Delete @key
      }
      else {
        return value
      }
    }

    // Missuse as tree walker
    JSON.stringify(this, resolve)

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
