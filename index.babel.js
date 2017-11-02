require('babel-polyfill');

const D3 = require('d3');
const topojson = require('topojson');

require('d3-selection-multi');

require('./index.pcss');

process.on('unhandledRejection', (error) => {
	throw error;
});

window.addEventListener('unhandledrejection', (error) => {
	throw error;
});

const geoToPoint = ([latitude, longitude]) => ([
	(longitude + 180) / 360 * 960,
	(90 - latitude) / 180 * 500 + 70,
]);

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

	const tweets = await new Promise((resolve, reject) => {
		D3.json('data/geo-tweets.json', (error, data) => {
			if (error) {
				reject(error);
			} else {
				resolve(data);
			}
		});
	});

	console.log(tweets[0]);

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

	const emojiGroup = svg.append('g');

	for (const tweet of tweets.slice(0, 200)) {
		const emoji = tweet.emojis[0];

		const [x, y] = geoToPoint(tweet.geo.coordinates);

		const group = emojiGroup.append('g').attrs({
			class: '',
			transform: `translate(${x}, ${y}) scale(0.1) translate(-75, -75)`,
			'transform-origin': 'center',
		});

		group.append('image').attrs({
			class: 'emoji animated zoomInUp',
			'transform-origin': 'center',
			'xlink:href': `node_modules/twemoji/2/svg/${emoji.unified.toLowerCase()}.svg`,
			width: 150,
			height: 150,
		});

		await new Promise((resolve) => {
			setTimeout(resolve, 50);
		});
	}
})();
