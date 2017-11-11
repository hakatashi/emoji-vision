const D3 = require('d3');

const noop = require('lodash/noop');

module.exports = class EmojiDetailStat {
	constructor(props) {
		this.svg = props.svg;
	}

	static create(node, {emoji = noop}) {
		console.log(emoji);
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

		D3.json(`../data/statistics/slim/${emoji}.json`, (error, data) => {
			if (error) {
				console.log(error);
			}

			data.date.entries.forEach((ds) => {
				ds[0] = parseTime(ds[0]);
			});

			x.domain(D3.extent(data.date.entries, (ds) => ds[0]));
			y.domain([0, D3.max(data.date.entries, (ds) => ds[1])]);

			const g = svg.append('g');

			g.append('path')
				.attr('fill', 'steelblue')
				.attr('d', area(data.date.entries));

			g.append('g')
				.attr('transform', `translate(0,${svgHeight})`)
				.call(D3.axisBottom(x));

			g.append('g')
				.call(D3.axisLeft(y))
				.append('text')
				.attr('fill', '#000')
				.attr('transform', 'rotate(-90)')
				.attr('y', 6)
				.attr('text-anchor', 'end')
				.text('Count');
		});

		return new EmojiDetailStat({
			svg,
		});
	}
};
