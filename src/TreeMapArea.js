const ndarray = require('ndarray');
const D3 = require('d3');

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
			transform: `translate(${x * UNIT}, ${y * UNIT})`,
			'transform-origin': 'center',
		});

		group.append('circle').attrs({
			cx: UNIT / 2,
			cy: UNIT / 2,
			r: 15,
		});

		this.currentView.set(x, y, group);
		this.reverseMap.set(group, {x, y});

		setTimeout(() => {
			this.remove(group);
		}, 3000);
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
