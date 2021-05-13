const path = require('path');
const { SourceMapDevToolPlugin } = require('webpack');

function getExternals () {
  // @ts-ignore
  let manifest = require('./package.json');
  let dependencies = manifest.dependencies;
  let externals = {};
  for (let p in dependencies) {
    externals[p] = 'commonjs ' + p;
  }
  return externals;
}

const config = {
  mode: 'development',
  entry: './src/index.js',
  externalsPresets: {
    node: true, // node.js 内置的 package 作为外部扩展
  },
  externals: getExternals(), // node.js 引入的 package 都作为外部扩展
  target: 'node', // 打包为 node.js 后端应用
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'app.js',
  },
  node: {
    __dirname: true // 允许使用 __dirname 全局变量
  },
};

const config_dev = {
  devtool: false,
  plugins: [new SourceMapDevToolPlugin({})],
};

const config_prod = {
  mode: 'production',
};

module.exports = (env, argv) => {
  if (argv.mode === 'production') {
    console.log('Build under production mode');
    return {
      ...config,
      ...config_prod
    };
  };
  console.log('Build under development mode');
  return {
    ...config,
    ...config_dev,
  };
};
