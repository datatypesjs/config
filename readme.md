# Config

Load configurations from cli, environment and config files
and validate them with a JSON schema.

Per default environment variables are understood like this:

```sh
MYAPP_EMAIL__CLIENT_ID=123abc
```

gets parsed to

```js
{
  email: {
    clientId: '123abc',
  },
}
```


## Installation

```sh
npm install @datatypes/config
```


## Usage

```js
const Config = require('@datatypes/config')
const config = new Config()

config
  .loadEnvironment({
    prefix: 'MYAPP_',    // Default is ''
    pathSeparator: '--', // Default is __
    wordSeparator: '-',  // Default is _
    casing: 'snake',     // Default is camel
  })
  .loadCliArguments()
  .loadDefaultFiles()
  .loadFile({path: 'path/to/config-file.yaml'})

console.log(config.object)
```


### Default files

With increasing priority:

- `.myapp`
- `.myapp.{json,yaml}`
- `.myapp/config`
- `.myapp/config.{json,yaml}`
- `.config/myapp/config.{json,yaml}` (This with `.yaml` is recommended)
- `.config/myapp/myapp.{json,yaml}`
- `/parent/path/**/.myapp.{json,yaml}`
- …
- `$(pwd)/.myapp.{json,yaml}`


## Related

- [nconf] - Hierarchical node.js configuration with files,
  environment variables, command-line arguments and atomic object merging.
- [node-config] - Node.js Application Configuration.
- [node-convict] - Unruly configuration management for nodejs.
- [rc] - The non-configurable configuration loader for lazy people.

[nconf]: https://github.com/indexzero/nconf
[node-config]: https://github.com/lorenwest/node-config
[node-convict]: https://github.com/mozilla/node-convict
[rc]: https://github.com/dominictarr/rc
