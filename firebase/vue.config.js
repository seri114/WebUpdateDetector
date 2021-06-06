module.exports = {
    configureWebpack: {
      devtool: 'source-map'
    },
    devServer: {
    
        host: 'localhost'
        },
    pages: {
      index: {
        entry: "src/main.ts",
        title: "WebUpdateDetector",
      }
    }
  }