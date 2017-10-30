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

	const svg = D3.select('body').append('svg').attr('width', 2000).attr('height', 1000);

	const worldMap = topojson.feature(data, data.objects.countries);
	const worldPath = D3.geoPath().projection(D3.geoMercator().clipExtent([[-Infinity, 0], [Infinity, 450]]));
	const map = svg.selectAll('path').data(worldMap.features).enter().append('path').attrs({
		d: worldPath,
		stroke: '#BBB',
		fill: '#666',
		'stroke-width': 0.5,
	});
})();
