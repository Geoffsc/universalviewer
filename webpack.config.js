const path = require("path");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const webpack = require("webpack");

function resolvePath(p) {
    return path.resolve(__dirname, p)
}

const config = {
    // These are the entry point of our library. We tell webpack to use the name we assign later, when creating the bundle.
    // We also use the name to filter the second entry point for applying code minification via UglifyJS
    entry: {
        'UV': ['./src/index.ts'],
        'AVExtension': ['./src/extensions/uv-av-extension/Extension.ts'],
        'DefaultExtension': ['./src/extensions/uv-default-extension/Extension.ts'],
        'MediaElementExtension': ['./src/extensions/uv-mediaelement-extension/Extension.ts'],
        'OpenSeadragonExtension': ['./src/extensions/uv-openseadragon-extension/Extension.ts'],
        'PDFExtension': ['./src/extensions/uv-pdf-extension/Extension.ts'],
        'VirtexExtension': ['./src/extensions/uv-virtex-extension/Extension.ts']
    },

    externals: {
        'node-fetch': 'fetch',
        'fetch-cookie': 'fetch',
        'tough-cookie': 'fetch',
    },
    // The output defines how and where we want the bundles. The special value `[name]` in `filename` tells Webpack to use the name we defined above.
    // We target a UMD and name it UV. When including the bundle in the browser it will be accessible at `window.UV`
    output: {
        path: resolvePath('dist-umd'),
        filename: '[name].js',
        libraryTarget: 'umd',
        library: 'UV',
        umdNamedDefine: true,
        chunkFilename: '[name].bundle.js'
    },
    node: {
        net: 'empty'
    },
    // Add resolve for `tsx` and `ts` files, otherwise Webpack would
    // only look for common JavaScript file extension (.js)
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    // Activate source maps for the bundles in order to preserve the original
    // source when the user debugs the application
    //devtool: 'source-map',
    optimization: {
        splitChunks: {
            chunks: 'all',
            minSize: 30000,
            maxSize: 0,
            minChunks: 1,
            maxAsyncRequests: 5,
            maxInitialRequests: 3,
            automaticNameDelimiter: '~',
            automaticNameMaxLength: 30,
            name: true,
            cacheGroups: {
                vendors: {
                    enforce: true,
                    test: /[\\/]node_modules[\\/]/,
                    priority: -10
                },
                osd: {
                    test: /[\\/]node_modules[\\/]openseadragon[\\/]/,
                    priority: -9
                },
                pdf: {
                    test: /[\\/]node_modules[\\/]pdf[\\/]/,
                    priority: -7
                },
                default: {
                    minChunks: 2,
                    priority: -20,
                    reuseExistingChunk: true
                },
                sharedmodule: {
                    test: /[\\/]src[\\/]modules[\\/]uv\-shared\-module[\\/]/,
                    priority: -8
                }
            }
        }
    },
    // Webpack doesn't understand TypeScript files and a loader is needed.
    module: {
        rules: [{
            test: /\.ts$/,
            use: [{
                loader: 'awesome-typescript-loader'
            }]
        }]
    },
    plugins: [
        new BundleAnalyzerPlugin()
    ]
}

if (process.env.NODE_WEBPACK_LIBRARY_PATH) {
    config.output.path = resolvePath(process.env.NODE_WEBPACK_LIBRARY_PATH);
}

if (process.env.NODE_WEBPACK_LIBRARY_TARGET) {
    config.output.libraryTarget = process.env.NODE_WEBPACK_LIBRARY_TARGET;
}

module.exports = config;