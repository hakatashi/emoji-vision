const D3 = require('d3');
const topojson = require('topojson');

require('d3-selection-multi');

const mercatorProjection = D3.geoMercator().translate([480, 320]).clipExtent([[0, 0], [960, 500]]);

const geoToPoint = ([latitude, longitude]) => (mercatorProjection([longitude, latitude]));

const timezoneCities = [
	{
		name: 'Tokyo',
		coordinates: [35.653, 139.839],
		timezone: 540,
		delta: [20, -5],
	},
	{
		name: 'London',
		coordinates: [51.510, -0.118],
		timezone: 0,
		delta: [-30, 0],
	},
	{
		name: 'New York',
		coordinates: [40.731, -73.935],
		timezone: -300,
		delta: [20, 10],
	},
	{
		name: 'Singapore',
		coordinates: [1.290, 103.852],
		timezone: 480,
		delta: [-25, 15],
	},
];

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
	const worldPath = D3.geoPath().projection(mercatorProjection);
	const map = worldGroup.selectAll('path').data(worldMap.features).enter().append('path').attrs({
		d: worldPath,
		stroke: '#BBB',
		fill: '#666',
		'stroke-width': 0.5,
	});

	const citiesGroup = svg.append('g');
	const citiesMap = new Map();

	for (const city of timezoneCities) {
		const [x, y] = geoToPoint(city.coordinates);
		citiesGroup.append('circle').attrs({
			cx: x,
			cy: y,
			r: 2,
			fill: 'white',
		});

		const cityLabel = citiesGroup.append('text').attrs({
			class: 'exo-2',
			x: x + city.delta[0],
			y: y + city.delta[1] + 15,
			'font-size': 10,
			'text-anchor': 'middle',
			fill: 'white',
		}).text(city.name);

		const cityTime = citiesGroup.append('text').attrs({
			class: 'exo-2',
			x: x + city.delta[0],
			y: y + city.delta[1] + 25,
			'font-size': 10,
			'text-anchor': 'middle',
			fill: 'white',
		});

		citiesMap.set(city.name, cityTime);
	}

	const emojiGroup = svg.append('g');

	const sortedTweets = tweets.sort((a, b) => {
		const dateA = new Date(a.created_at);
		const dateB = new Date(b.created_at);

		return dateA - dateB;
	});

	const currentTime = svg.append('text').attrs({
		class: 'exo-2',
		x: 20,
		y: 480,
		fill: 'white',
	});

	for (const tweet of sortedTweets) {
		const emoji = tweet.emojis[0];

		const [x, y] = geoToPoint(tweet.geo.coordinates);

		const group = emojiGroup.append('g').attrs({
			class: '',
			transform: `translate(${x}, ${y}) scale(0.1) translate(-75, -75)`,
			'transform-origin': 'center',
		});

		group.append('image').attrs({
			class: 'emoji animated bounceIn',
			'transform-origin': 'center',
			'xlink:href': `node_modules/twemoji/2/svg/${emoji.unified.toLowerCase()}.svg`,
			width: 150,
			height: 150,
		});

		const time = new Date(tweet.created_at);

		currentTime.text(`${time.toLocaleDateString()} ${time.toLocaleTimeString()}`)

		const untimezonedTime = new Date(time.getTime() + time.getTimezoneOffset() * 60 * 1000);
		for (const city of timezoneCities) {
			const cityTime = new Date(untimezonedTime.getTime() + city.timezone * 60 * 1000);
			citiesMap.get(city.name).text([
				cityTime.getHours().toString().padStart(2, '0'),
				cityTime.getMinutes().toString().padStart(2, '0'),
			].join(':'));
		}

		setTimeout(() => {
			const image = group.selectAll('image');
			image.attr('class', 'emoji animated bounceOut');
			image.on('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', () => {
				group.remove();
			});
		}, 3000)

		await new Promise((resolve) => {
			setTimeout(resolve, 50);
		});
	}
})();
