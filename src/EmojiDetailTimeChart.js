const D3 = require('d3');
require('d3-selection-multi');

module.exports = class EmojiDetailTimeChart {
	constructor(props) {
		this.svg = props.svg;
	}

	static create(node, {data}) {
		const svg = D3.select(node).append('svg').attrs({
			width: '100%',
			height: '100%',
		});

		const parseTime = D3.timeParse('%Y-%m-%d');
		const svgWidth = parseInt(svg.style('width'));
		const svgHeight = parseInt(svg.style('height'));

		const x = D3.scaleTime().range([0, svgWidth]);
		const y = D3.scaleLinear().range([svgHeight, 0]);

		const area = D3.area()
			.x((ds) => x(ds[0]))
			.y0(svgHeight)
			.y1((ds) => y(ds[1]));

		const statData = data;

		statData.date.entries.forEach((ds) => {
			ds[0] = parseTime(ds[0]);
		});

		statData.date.entries.sort((xs, ys) => xs[0] - ys[0]);

		x.domain(D3.extent(statData.date.entries, (ds) => ds[0]));
		y.domain([0, D3.max(statData.date.entries, (ds) => ds[1])]);

		const g = svg.append('g');

		g.append('path')
			.attr('fill', 'steelblue')
			.attr('d', area(statData.date.entries))
			.attr('class', 'time-area');

		g.append('g')
			.attr('transform', `translate(0,${svgHeight})`)
			.call(D3.axisBottom(x));

		const yAxis = g.append('g')
			.call(D3.axisLeft(y));

		svg.selectAll('.domain, line')
			.styles({
				fill: 'none',
				stroke: 'white',
			});

		svg.selectAll('text')
			.styles({
				fill: 'white',
			});

		yAxis
			.append('text')
			.attr('transform', 'rotate(-90)')
			.attr('y', 6)
			.attr('text-anchor', 'end')
			.text('Count');

		return new EmojiDetailTimeChart({
			svg,
		});
	}
};
