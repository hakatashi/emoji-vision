const ndarray = require('ndarray');
const D3 = require('d3');

const {textwrap} = require('d3-textwrap');

const WIDTH = 960;
const HEIGHT = 500;
const UNIT = 40;

module.exports = class TreeMapArea {
	constructor({node, width, height}) {
		this.node = node;
		this.width = width;
		this.height = height;

		const areaWidth = Math.floor(WIDTH / UNIT);
		const areaHeight = Math.floor(HEIGHT / UNIT);
		this.area = ndarray(Array(areaWidth * areaHeight).fill(null), [areaWidth, areaHeight]);

		this.currentView = this.area.hi(Math.floor(width / UNIT), Math.floor(height / UNIT));
		this.reverseMap = new WeakMap();
	}

	resize({width, height}) {
		const newWidthUnits = Math.floor(width / UNIT);
		const newHeightUnits = Math.floor(height / UNIT);

		for (let y = 0; y < this.currentView.shape[1]; y++) {
			for (let x = 0; x < this.currentView.shape[0]; x++) {
				if ((x >= newWidthUnits || y >= newHeightUnits) && this.currentView.get(x, y) !== null) {
					this.remove(this.currentView.get(x, y));
				}
			}
		}

		this.width = width;
		this.height = height;
		this.currentView = this.area.hi(newWidthUnits, newHeightUnits);
	}

	showTweet(tweet) {
		const emoji = tweet.emojis[0];

		const coordinates = this.allocate();
		if (coordinates === null) {
			return;
		}

		const [x, y] = coordinates;

		const node = D3.select(this.node);

		const group = node.append('g').attrs({
			transform: `translate(${(x + 0.5) * UNIT}, ${(y + 0.5) * UNIT})`,
			'transform-origin': 'center',
		});

		const fileName = emoji.unified.startsWith('00') ? emoji.unified.slice(2).toLowerCase() : emoji.unified.toLowerCase();

		const image = group.append('image').attrs({
			class: 'emoji animated bounceIn',
			'transform-origin': 'center',
			'xlink:href': `node_modules/twemoji/2/svg/${fileName}.svg`,
			width: 30,
			height: 30,
			x: -15,
			y: -15,
		}).styles({
			cursor: 'pointer',
		});

		let isTooltipShown = false;
		let isEraceCancelled = false;

		const erase = () => {
			image.attr('class', 'emoji animated bounceOut');
			image.on('mouseover', null);
			image.on('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', () => {
				this.remove(group);
			});
		};

		image.on('mouseover', () => {
			isTooltipShown = true;

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
				isTooltipShown = false;

				if (isEraceCancelled) {
					erase();
				}
			});
		});

		image.on('click', () => {
			this.onClickEmoji(emoji);
		});

		setTimeout(() => {
			if (isTooltipShown) {
				isEraceCancelled = true;
				return;
			}

			erase();
		}, 3000);

		this.currentView.set(x, y, group);
		this.reverseMap.set(group, {x, y});
	}

	remove(group) {
		const {x, y} = this.reverseMap.get(group);
		const locatedGroup = this.currentView.get(x, y);

		if (locatedGroup !== group) {
			return;
		}

		this.currentView.set(x, y, null);
		group.remove();
	}

	allocate() {
		for (let y = 0; y < this.currentView.shape[1]; y++) {
			for (let x = 0; x < this.currentView.shape[0]; x++) {
				if (this.currentView.get(x, y) === null) {
					return [x, y];
				}
			}
		}

		return null;
	}

	clear() {
		for (let y = 0; y < this.currentView.shape[1]; y++) {
			for (let x = 0; x < this.currentView.shape[0]; x++) {
				if (this.currentView.get(x, y) !== null) {
					this.remove(this.currentView.get(x, y));
				}
			}
		}
	}
};
