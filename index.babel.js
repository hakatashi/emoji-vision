require('babel-polyfill');

const D3 = require('d3');
const topojson = require('topojson');

require('d3-selection-multi');

process.on('unhandledRejection', (error) => {
	throw error;
});

window.addEventListener('unhandledrejection', (error) => {
	throw error;
});

(async () => {
	const data = await new Promise((resolve, reject) => {
		D3.json('https://unpkg.com/world-atlas@1/world/110m.json', (error, data) => {
			if (error) {
				reject(error);
			} else {
				resolve(data);
			}
		});
	});

	const svg = D3.select('body').append('svg').attrs({
		width: '100%',
		height: '100%',
		viewBox: '0 0 960 500',
	});

	const worldGroup = svg.append('g');

	const worldMap = topojson.feature(data, data.objects.countries);
	const worldPath = D3.geoPath().projection(D3.geoMercator().translate([480, 320]).clipExtent([[0, 0], [960, 500]]));
	const map = worldGroup.selectAll('path').data(worldMap.features).enter().append('path').attrs({
		d: worldPath,
		stroke: '#BBB',
		fill: '#666',
		'stroke-width': 0.5,
	});
})();
