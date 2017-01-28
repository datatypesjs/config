const path = require('path')

module.exports = {
  somePath: path.format({
    dir: '/Path/to/some/dir',
    base: 'file.txt',
  }),
}
