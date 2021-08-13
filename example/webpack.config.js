const path = require('path')
const nodeExternals = require('webpack-node-externals')

module.exports = {
  context: __dirname,
  entry  : './src/index.ts',
  externals: [nodeExternals()],
  module : {
    rules: [
      {
        exclude: /node_modules/,
        test   : /.ts$/,
        use    : {
          loader: 'ts-loader'
        },
      }
    ]
  },
  node: {
    __dirname: false
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  output: {
    filename  : 'index.js',
    path      : path.resolve(__dirname, 'dist'),
    publicPath: '/dist/'
  },
  target: 'node'
}
