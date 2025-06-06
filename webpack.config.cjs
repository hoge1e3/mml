
//const IgnoreDynamicRequire = require('webpack-ignore-dynamic-require');
const type="esm";
const outputs={
  esm: {
    libraryTarget: 'module',
    path: `${__dirname}/dist`,
    filename: "[name].js",
  },
  umd: {
    library: "mml",
    libraryTarget: 'umd',
    path: `${__dirname}/dist`,
    filename: "[name].umd.js",
  }
};
module.exports = (env,argv)=>({
    // モード値を production に設定すると最適化された状態で、
    // development に設定するとソースマップ有効でJSファイルが出力される
    mode: 'development',
    // メインとなるJavaScriptファイル（エントリーポイント）
    entry: {
      mml:'./js/src/mml.js',
      test:"./js/test/test.js",
    },
    experiments: {
    	outputModule: true,
    },
    output: outputs[type],
    module: {
        rules: [
            /*{
                // 拡張子 .ts の場合
                test: /\.ts$/,
                // TypeScript をコンパイルする
                use: {
        			loader:'ts-loader',
        		},
            },*/
        ],
        parser: {
          javascript: {
            importMeta: !env.production,
            commonjsMagicComments: true
          },
        },
    },
    resolve: {
        // 拡張子を配列で指定
        extensions: [
            '.js',
        ],
    },
    
  plugins: [
    //new IgnoreDynamicRequire()
  ],
});
