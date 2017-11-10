const ndarray = require('ndarray');
const D3 = require('d3');

const {selectEmoji} = require('./util.js');

const WIDTH = 960;
const HEIGHT = 500;
const UNIT = 40;

module.exports = class TreeMapArea {
	constructor({node, width, height, offset, onEmojiMouseOver, onEmojiMouseLeave}) {
		this.node = node;
		this.width = width;
		this.height = height;
		this.offset = offset;
		this.onEmojiMouseOver = onEmojiMouseOver;
		this.onEmojiMouseLeave = onEmojiMouseLeave;

		const areaWidth = Math.floor(WIDTH / UNIT);
		const areaHeight = Math.floor(HEIGHT / UNIT);
		this.area = ndarray(Array(areaWidth * areaHeight).fill(null), [areaWidth, areaHeight]);

		this.currentView = this.area.hi(Math.floor(width / UNIT), Math.floor(height / UNIT));
		this.reverseMap = new WeakMap();
		this.hoveredGroups = new Set();
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
		const emoji = selectEmoji(tweet.emojis);

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

		const fileName = emoji.startsWith('00') ? emoji.slice(2).toLowerCase() : emoji.toLowerCase();

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
			this.onEmojiMouseOver({x: (x + 0.5) * UNIT, y: (y + 0.5) * UNIT, group, text: tweet.text, node: this.node});
			this.hoveredGroups.add(group);

			image.on('mouseleave', () => {
				isTooltipShown = false;
				this.onEmojiMouseLeave({group});
				this.hoveredGroups.delete(group);

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
		for (const group of this.hoveredGroups) {
			this.onEmojiMouseLeave({group});
		}

		for (let y = 0; y < this.currentView.shape[1]; y++) {
			for (let x = 0; x < this.currentView.shape[0]; x++) {
				if (this.currentView.get(x, y) !== null) {
					this.remove(this.currentView.get(x, y));
				}
			}
		}
	}
};
