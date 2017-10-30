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
					],
				},
			},
			exclude: /node_modules/,
		}],
	},
};
