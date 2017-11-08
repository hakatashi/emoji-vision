const D3 = require('d3');

require('d3-selection-multi');

module.exports = class TreeMapChart {
	constructor(props) {
		this.svg = props.svg;
	}

	static create(node) {
		const svg = D3.select(node).append('svg').attrs({
			width: '100%',
			height: '100%',
			viewBox: '0 0 960 500',
		});

		return new TreeMapChart({
			svg,
		});
	}
};
