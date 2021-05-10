/*
 * @Author: wangyuan
 * @Date: 2021-05-10 15:46:49
 * @LastEditTime: 2021-05-10 16:38:50
 * @LastEditors: wangyuan
 * @Description:
 */
const webpack = require('webpack') //访问内置的插件
const path = require('path')
let UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const config = {
  target: 'node',
  entry: './src/index.js',
  output: {
    filename: 'lib.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget:"umd"
  },
  //   resolve:{
  //     fallback: {
  //         crypto: require.resolve('crypto-browserify'),
  //         path: require.resolve('path-browserify'),
  //         url: require.resolve('url'),
  //         buffer: require.resolve('buffer/'),
  //         util: require.resolve('util/'),
  //         stream: require.resolve('stream-browserify/'),
  //         vm: require.resolve('vm-browserify')
  //       },
  //   },
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          'babel-loader',
          //   {
          //     loader: 'node-loader',
          //     // options: {
          //     //   name: 'bin2.js',
          //     // },
          //   },
        ],
      },
    ],
  },
  externals: {
    fs: 'fs',
    path: 'path',
    inquirer: 'inquirer',
    shelljs: 'shelljs',
    ora: 'ora',
    compressing: 'compressing',
    moment: 'moment',
    'node-ssh': 'node-ssh',
    'string-random': 'string-random'
  },
  plugins: [new CleanWebpackPlugin()],
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        uglifyOptions: {
          compress: false,
        },
      }),
    ],
  },
}

module.exports = config
