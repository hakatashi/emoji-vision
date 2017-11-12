const D3 = require('d3');
require('d3-selection-multi');

const noop = require('lodash/noop');

const client = require('./data-client.js');

// const SECOND = 1000;
// const MINUTE = 60 * SECOND;
// const HOUR = 60 * MINUTE;
// const DAY = 24 * HOUR;

const emojiToFileName = ([emoji, minuteness]) => `${minuteness}/${emoji}.json`;


module.exports = class EmojiDetailTimeChart {
	constructor(props) {
		this.svg = props.svg;
	}

	static fetchStatData = async ([emoji, minuteness]) => {
		const fileName = emojiToFileName([emoji, minuteness]);
		console.info(`Loading ${fileName}...`);
		return await client([
			'statistics',
			fileName,
		].join('/')).catch((error) => {
			console.error(error);
			return {
				count: 0,
				date: {
					entries: [],
					total: 0,
				},
				device: {
					entries: [],
					total: 0,
				},
				group: 'Unknown',
				hashtag: {
					entries: [],
					total: 0,
				},
				name: 'Unknown',
				subgroup: 'Unknown',
			};
		});
	};

	static async create(node, {emoji = noop, minuteness = noop}) {
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

		const statData = await this.fetchStatData([emoji, minuteness]);

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
