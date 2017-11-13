/* eslint no-loop-func: "off" */

const D3 = require('d3');
const topojson = require('topojson');
const noop = require('lodash/noop');

require('d3-selection-multi');
const {textwrap} = require('d3-textwrap');

const {selectEmoji, getFileName, HOUR} = require('./util.js');

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
	{
		name: 'Sao Paulo',
		coordinates: [-23.534, -46.625],
		timezone: -180,
		delta: [25, 5],
	},
	{
		name: 'California',
		coordinates: [36.778, -119.418],
		timezone: -480,
		delta: [-25, 0],
	},
];

module.exports = class WorldMapChart {
	constructor(props) {
		this.svg = props.svg;
		this.emojiGroup = props.emojiGroup;
		this.tooltipGroup = props.tooltipGroup;
		this.citiesMap = props.citiesMap;
		this.onClickEmoji = props.onClickEmoji;

		this.isTooltipShownMap = new WeakMap();
		this.isEraceCancelledMap = new WeakMap();
		this.tweetDataMap = new WeakMap();
		this.shownEmojis = new Set();
	}

	static async create(node, {onClickEmoji = noop}) {
		const mapData = await new Promise((resolve, reject) => {
			D3.json('https://unpkg.com/world-atlas@1/world/110m.json', (error, data) => {
				if (error) {
					reject(error);
				} else {
					resolve(data);
				}
			});
		});

		const svg = D3.select(node).append('svg').attrs({
			width: '100%',
			height: '100%',
			viewBox: '0 0 960 500',
		});

		const worldGroup = svg.append('g');

		const worldMap = topojson.feature(mapData, mapData.objects.countries);
		const worldPath = D3.geoPath().projection(mercatorProjection);
		worldGroup.selectAll('path').data(worldMap.features).enter().append('path').attrs({
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

			citiesGroup.append('text').attrs({
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
		const tooltipGroup = svg.append('g');

		return new WorldMapChart({
			svg,
			emojiGroup,
			tooltipGroup,
			citiesMap,
			onClickEmoji,
		});
	}

	showTweets({tweets, time}) {
		const untimezonedTime = new Date(time.getTime() + time.getTimezoneOffset() * 60 * 1000);
		for (const city of timezoneCities) {
			const cityTime = new Date(untimezonedTime.getTime() + city.timezone * 60 * 1000);
			this.citiesMap.get(city.name).text([
				cityTime.getHours().toString().padStart(2, '0'),
				cityTime.getMinutes().toString().padStart(2, '0'),
			].join(':'));
		}

		for (const tweet of tweets) {
			const emoji = selectEmoji(tweet.emojis);

			const [x, y] = geoToPoint(tweet.geo.coordinates);

			const group = this.emojiGroup.append('g').attrs({
				class: '',
				transform: `translate(${x}, ${y}) scale(0.1) translate(-75, -75)`,
				'transform-origin': 'center',
			});

			this.shownEmojis.add(group);
			this.tweetDataMap.set(group, tweet);
			this.isTooltipShownMap.set(group, false);
			this.isEraceCancelledMap.set(group, false);

			const image = group.append('image').attrs({
				class: 'emoji animated bounceIn',
				'transform-origin': 'center',
				'xlink:href': getFileName(emoji, 'twitter'),
				width: 150,
				height: 150,
			}).styles({
				cursor: 'pointer',
			});

			image.on('mouseover', () => {
				this.isTooltipShownMap.set(group, true);

				const tooltipWidth = 200;
				const tooltipHeight = 80;
				const padding = 5;

				const tooltipWrap = this.tooltipGroup.append('g').attrs({
					class: 'animated fadeInDown',
				}).styles({
					'animation-duration': '0.2s',
					'pointer-events': 'none',
				});

				const tooltip = tooltipWrap.append('g').attrs({
					transform: `translate(${x}, ${y}) scale(0.6)`,
					'transform-origin': 'center',
				});

				tooltip.append('rect').attrs({
					x: -tooltipWidth / 2,
					y: -tooltipHeight - 20,
					rx: 3,
					ry: 3,
					width: tooltipWidth,
					height: tooltipHeight,
					fill: 'rgba(255, 255, 255, 0.7)',
				});

				tooltip.append('polygon').attrs({
					points: '-5,-20 5,-20 0,-15',
					fill: 'rgba(255, 255, 255, 0.7)',
				});

				const textGroup = tooltip.append('g').attrs({
					fill: '#333',
					'font-size': 8,
					transform: `translate(${-tooltipWidth / 2 + padding}, ${-tooltipHeight - 20 + padding})`,
				});

				textGroup.append('text').text(tweet.text).call(textwrap().bounds({
					width: tooltipWidth - padding * 2,
					height: tooltipHeight - padding * 2,
				}));

				textGroup.selectAll('div').styles({color: '#333'});

				image.on('mouseleave', () => {
					tooltipWrap.attr('class', 'animated fadeOutUp');
					tooltipWrap.on('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', () => {
						tooltipWrap.remove();
					});
					this.isTooltipShownMap.set(group, false);

					if (this.isEraceCancelledMap.get(group)) {
						this.softRemove();
					}
				});
			});

			image.on('click', () => {
				this.onClickEmoji(emoji);
			});
		}

		this.updateTime(time);
	}

	softRemove(group) {
		const image = group.select('image');
		image.attr('class', 'emoji animated bounceOut');
		image.on('mouseover', null);
		image.on('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', () => {
			group.remove();
			this.shownEmojis.delete(group);
		});
	}

	updateTime(time) {
		for (const group of this.shownEmojis) {
			const tweet = this.tweetDataMap.get(group);

			if (time.getTime() > tweet.time + HOUR || time.getTime() < tweet.time) {
				if (this.isTooltipShownMap.get(group)) {
					this.isEraceCancelledMap.set(group, true);
				} else {
					this.softRemove(group);
				}
			}
		}
	}
};
