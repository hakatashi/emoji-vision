const D3 = require('d3');

require('d3-selection-multi');
const {schemePastel1} = require('d3-scale-chromatic');

module.exports = class TreeMapChart {
	constructor(props) {
		this.svg = props.svg;
		this.treemap = props.treemap;
		this.colorScale = props.colorScale;
		this.cells = props.cells;
	}

	static create(node) {
		const svg = D3.select(node).append('svg').attrs({
			width: '100%',
			height: '100%',
			viewBox: '0 0 960 500',
		});

		const treemap = D3.treemap().tile(D3.treemapResquarify).size([960, 500]).round(true).paddingInner(1);
		const colorScale = D3.scaleOrdinal(schemePastel1);

		const cells = svg.append('g');

		return new TreeMapChart({
			svg,
			treemap,
			colorScale,
			cells,
		});
	}

	updateLayout(categories) {
		const root = D3.hierarchy({
			name: '',
			children: categories,
		}).sum((category) => category.count).sort((a, b) => b.height - a.height || b.value - a.value);

		this.treemap(root);
		console.log(root.leaves());
		console.log(root.leaves()[0]);

		const leaves = this.cells.selectAll('g').data(root.leaves());

		leaves.attrs({
			transform: (d) => `translate(${d.x0}, ${d.y0})`,
		});

		leaves.select('rect').attrs({
			width: (d) => d.x1 - d.x0,
			height: (d) => d.y1 - d.y0,
			fill: (d, index) => this.colorScale(index),
		});

		leaves.enter().append('g').attrs({
			transform: (d) => `translate(${d.x0}, ${d.y0})`,
		}).styles({
			transition: 'all 0.5s',
		}).append('rect').attrs({
			width: (d) => d.x1 - d.x0,
			height: (d) => d.y1 - d.y0,
			fill: (d, index) => this.colorScale(index),
		}).styles({
			transition: 'all 0.5s',
		});
	}

	showTweets(tweets) {
	}
};
