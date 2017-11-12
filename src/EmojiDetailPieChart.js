const D3 = require('d3');
require('d3-selection-multi');

const noop = require('lodash/noop');
const ISO6391 = require('iso-639-1');

const client = require('./data-client.js');

const emojiToFileName = ([emoji, minuteness]) => `${minuteness}/${emoji}.json`;

module.exports = class EmojiDetailPieChart {
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

	static async create(node, {emoji = noop, minuteness = noop, mode = noop}) {
		const svg = D3.select(node).append('svg').attrs({
			width: '100%',
			height: '100%',
			viewBox: '0 0 1000 1000',
		});

		const radius = 400;

		const statData = await this.fetchStatData([emoji, minuteness]);

		const color = D3.scaleOrdinal(['#98abc5', '#8a89a6', '#7b6888', '#6b486b', '#a05d56', '#d0743c', '#ff8c00']);

		const pie = D3.pie()
			.sort(null)
			.value((data) => data[1]);

		const path = D3.arc()
			.outerRadius(radius)
			.innerRadius(0);

		const label = D3.arc()
			.outerRadius(radius / 1.5)
			.innerRadius(radius / 1.5);

		const g = svg.append('g')
			.attr('transform', 'translate(500, 500)');

		const arc = g.selectAll('.arc')
			.data(pie(statData[mode].entries.slice(0, 10)))
			.enter()
			.append('g');

		arc.append('path')
			.attr('d', path)
			.attr('fill', (d) => color(d.data[0]));

		arc.append('text')
			.attr('transform', (d) => `translate(${label.centroid(d)})`)
			.attr('dy', '0.35em')
			.attr('font-size', 100)
			.attr('text-anchor', 'middle')
			.text((d) => ISO6391.getNativeName(d.data[0]));

		return new EmojiDetailPieChart({
			svg,
		});
	}
};
