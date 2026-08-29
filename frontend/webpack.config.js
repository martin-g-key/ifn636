// Node bundles the React App. 

const path=require('path');
const webpack=require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    // bundling starts
    entry: './src/index.js',
    
    // destination for bundled output
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.[contenthash].js',
        clean: true, // hygeine. Wipe old builds from /dist
    },
    
    module: {
        rules: [
            {
                // For every .js/.jsx file, run Babel 
                // so browser gets plain JS
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: 'babel-loader',
            },
        ],
    },

    resolve: {
        extensions: ['.js', '.jsx'] 
    }, 

    plugins: [
        // generate dist/index.html from template and inject bundle tag
        new HtmlWebpackPlugins({ template: './public/index.html' }),

        //
        new webpack.DefinePlugin({
            'process.env.API_BASE': JSON.stringify(
                process.env.API_BASE || 'http://localhost:3001'
            ),
        }),
    ],

    // local dev server
    devServer: {
        static: '/.dist',
        port: 3000,
        historyApiFallback: true,
        hot: true,
    },
};
