const D3 = require('d3');
require('d3-selection-multi');

const ISO6391 = require('iso-639-1');

module.exports = class EmojiDetailPieChart {
	constructor(props) {
		this.svg = props.svg;
	}

	static create(node, {data, mode}) {
		const svg = D3.select(node).append('svg').attrs({
			width: '100%',
			height: '100%',
			viewBox: '0 0 1000 1000',
		});

		const radius = 400;

		const statData = data;
		const statDataToShow = statData[mode].entries.slice(0, 10);
		let sum = 0;
		statDataToShow.forEach((ds) => {
			sum += ds[1];
		});
		statDataToShow.push(['Others', statData[mode].total - sum]);

		const color = D3.scaleOrdinal(['#98abc5', '#8a89a6', '#7b6888', '#6b486b', '#a05d56', '#d0743c', '#ff8c00']);

		const pie = D3.pie()
			.sort(null)
			.value((data) => data[1]);

		const path = D3.arc()
			.outerRadius(radius)
			.innerRadius(0);

		const label = D3.arc()
			.outerRadius(radius + 20)
			.innerRadius(radius + 5);

		const g = svg.append('g')
			.attr('transform', 'translate(500, 500)');

		const arc = g.selectAll('.arc')
			.data(pie(statDataToShow))
			.enter()
			.append('g');

		arc.append('path')
			.attr('d', path)
			.attr('fill', (d) => color(d.data[0]));

		arc.append('text')
			.attr('transform', (d) => {
				const midAngle = ((d.startAngle + d.endAngle) / 2) < Math.PI ? d.startAngle / 2 + d.endAngle / 2 : d.startAngle / 2 + d.endAngle / 2 + Math.PI;
				return `translate(${label.centroid(d)[0]},${label.centroid(d)[1]}) rotate(-90) rotate(${midAngle * 180 / Math.PI})`;
			})
			.attr('dy', '0.35em')
			.attr('font-size', (d) => (d.endAngle - d.startAngle) > (Math.PI / 180 * 20) ? 50 : 25)
			.attr('font-weight', '300')
			.attr('text-anchor', 'middle')
			.attr('fill', 'white')
			.text((d) => {
				if (mode === 'lang') {
					if (d.data[0] === 'Others') {
						return 'Others';
					}
					return ISO6391.getNativeName(d.data[0]);
				}
				return d.data[0];
			});

		return new EmojiDetailPieChart({
			svg,
		});
	}
};
