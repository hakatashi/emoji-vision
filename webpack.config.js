require('dotenv').config();
const webpack = require('webpack');
module.exports = {
	entry: './index.babel.js',
	output: {
		path: __dirname,
		filename: 'index.js',
	},
	devtool: 'cheap-module-eval-source-map',
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
		}),
	],
};

