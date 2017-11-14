require('dotenv').config();

const webpack = require('webpack');
const MinifyPlugin = require('babel-minify-webpack-plugin');

module.exports = (env = {}) => ({
	entry: './index.babel.js',
	output: {
		path: __dirname,
		filename: 'index.js',
	},
	devtool: env.production ? 'source-map' : 'cheap-module-eval-source-map',
	module: {
		rules: [{
			test: /\.jsx?$/,
			use: {
				loader: 'babel-loader',
				options: {
					presets: [
						['env', {
							targets: {
								browsers: [
									'last 2 chrome versions',
								],
							},
							useBuiltIns: 'entry',
							debug: true,
						}],
						'react',
					],
					plugins: [
						'transform-class-properties',
					],
				},
			},
			exclude: /node_modules/,
		}, {
			test: /\.pcss$/,
			use: [
				'style-loader',
				{loader: 'css-loader', options: {importLoaders: 1}},
				'postcss-loader',
			],
		}],
	},
	node: {
		fs: 'empty',
		net: 'empty',
		tls: 'empty',
	},
	plugins: [
		new webpack.DefinePlugin({
			'process.env.AZURE_STORAGE_ACCOUNT': JSON.stringify(process.env.AZURE_STORAGE_ACCOUNT),
			'process.env.AZURE_STORAGE_ACCESS_KEY': JSON.stringify(process.env.AZURE_STORAGE_ACCESS_KEY),
			'process.env.NODE_ENV': JSON.stringify(env.production ? 'production' : 'development'),
		}),
		...(env.production ? [
			new MinifyPlugin({mangle: false}),
		] : []),
	],
});
