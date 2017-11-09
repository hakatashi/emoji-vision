const ndarray = require('ndarray');
const D3 = require('d3');

const WIDTH = 960;
const HEIGHT = 500;
const UNIT = 20;

module.exports = class TreeMapArea {
	constructor({node, width, height}) {
		this.node = node;
		this.width = width;
		this.height = height;

		const areaWidth = Math.floor(WIDTH / UNIT);
		const areaHeight = Math.floor(HEIGHT / UNIT);
		this.area = ndarray(Array(areaWidth * areaHeight).fill(null), [areaWidth, areaHeight]);

		this.currentView = this.area.hi(Math.floor(width / UNIT), Math.floor(height / UNIT));
	}

	resize({width, height}) {
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

		group.append('rect').attrs({
			x: 5,
			y: 5,
			width: 5,
			height: 5,
		});

		this.currentView.set(x, y, true);

		setTimeout(() => {
			this.currentView.set(x, y, null);
			group.remove();
		}, 3000);
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
};
