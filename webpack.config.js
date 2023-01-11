const path = require("path");
const pkg = require('./package.json');
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require("html-webpack-plugin");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const {
  CleanWebpackPlugin
} = require("clean-webpack-plugin");
const webpack = require("webpack");
const banner = `
${pkg.name}
${pkg.description}
@version v${pkg.version}
(c) 2022 ${pkg.author}
date: ${new Date().toLocaleString()}
hash: [hash]
`
module.exports = {
  optimization: {
    minimize: false // 关闭代码压缩，可选
  },
  mode: "production", //'development' 、 'production'、'none'
  entry: "./src/index.ts",
  // devServer: {
  // 	open: true,
  // 	port: 8081,
  // },
  // devtool: "inline-source-map",
  // performance :{
  // 	maxEntrypointSize: 10000000,
  // 	maxAssetSize: 30000000
  // },
  output: {
    library: 'yamCesium',
    // libraryExport: ['func', 'sum'],
    libraryTarget: 'umd',
    // umdNamedDefine: true, // umdNamedDefine为设置amd前置名称使用library设置的变量
    // globalObject: this, // globalObject为改变全局指向
    // 输出的路径  是绝对路径(导入path模块) 这里是用node来做的
    path: path.resolve(__dirname, "dist"),
    // 输出的文件名称
    filename: 'build/yam.cesium.min.js',
    environment: {
      arrowFunction: false // 关闭webpack的箭头函数，可选
    }
  },
  externals: {
    cesium: 'Cesium', // 打包时忽略掉Cesium
    "@turf/turf": 'turf',
    kdbush: "KDBush"
  },
  resolve: {
    extensions: [".ts", ".js", '.json']
  },
  plugins: [
    // new BundleAnalyzerPlugin(), // 查看打包文件大小
    new CleanWebpackPlugin(),
    new webpack.BannerPlugin(banner),
    // new CopyWebpackPlugin({ patterns: [{ from: path.resolve(__dirname, "src"), to: './' }] }),
    // new HtmlWebpackPlugin({
    // 	title: 'TS测试',
    // 	template: './src/index.html'
    // }),
  ],
  module: {
    rules: [{
        test: /\.ts$/,
        use: [{
            loader: "babel-loader",
            options: {
              presets: [
                [
                  '@babel/preset-env',
                  {
                    targets: {
                      chrome: 88,
                      ie: 11
                    },
                    corejs: 3,
                    useBuiltIns: "usage" //按需加载
                  }
                ]

              ]
            }
          },
          {
            loader: "ts-loader"
          }
        ],
        exclude: /node_modules/
      },
      // 打包css的配置
      {
          // 使用正则表达式,匹配那些文件
          test: /\.css$/,
          use:[
              // use数组中loader执行顺序, 从右到左, 从下到上, 依次执行
              // 创建style标签, 将js中的样式资源插入进行, 添加到head中生效
              'style-loader',
              // 将css文件变成commitjs模块加载js中, 里面的内容是样式字符串
              'css-loader'
          ]
      }
    ]
  }
}
