const D3 = require('d3');

require('d3-selection-multi');
const {schemePastel1} = require('d3-scale-chromatic');
const {textwrap} = require('d3-textwrap');
const noop = require('lodash/noop');

const TreeMapArea = require('./TreeMapArea.js');

module.exports = class TreeMapChart {
	constructor(props) {
		this.svg = props.svg;
		this.treemap = props.treemap;
		this.colorScale = props.colorScale;
		this.cells = props.cells;
		this.tooltipGroup = props.tooltipGroup;
		this.mode = props.mode;
		this.onClickEmoji = props.onClickEmoji;
		this.areaMap = new Map();
		this.tooltipMap = new WeakMap();
	}

	static create(node, {onClickEmoji = noop, mode}) {
		const svg = D3.select(node).append('svg').attrs({
			width: '100%',
			height: '100%',
			viewBox: '0 0 960 500',
		});

		const treemap = D3.treemap().tile(D3.treemapResquarify.ratio(2)).size([960, 500]).round(true).paddingInner(1);
		const colorScale = D3.scaleOrdinal(schemePastel1);

		const cells = svg.append('g').attrs({class: 'cells'});
		const tooltipGroup = svg.append('g');

		return new TreeMapChart({
			svg,
			treemap,
			colorScale,
			cells,
			tooltipGroup,
			mode,
			onClickEmoji,
		});
	}

	handleEmojiMouseOver = ({x, y, group, text, node}) => {
		const areaData = D3.select(node.parentNode).data()[0];

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
			transform: `translate(${x + areaData.x0}, ${y + areaData.y0}) scale(0.6)`,
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

		textGroup.append('text').text(text).call(textwrap().bounds({
			width: tooltipWidth - padding * 2,
			height: tooltipHeight - padding * 2,
		}));

		textGroup.selectAll('div').styles({color: '#333'});

		this.tooltipMap.set(group, tooltipWrap);
	}

	handleEmojiMouseLeave = ({group}) => {
		const tooltipWrap = this.tooltipMap.get(group);
		tooltipWrap.attr('class', 'animated fadeOutUp');
		tooltipWrap.on('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', () => {
			tooltipWrap.remove();
		});
	}

	updateLayout(categories) {
		const {areaMap, handleEmojiMouseOver, handleEmojiMouseLeave, onClickEmoji, mode} = this;

		const root = D3.hierarchy({
			name: '',
			children: categories,
		}).eachBefore((d) => {
			d.data.id = Buffer.from(d.data.name).toString('hex');
		}).sum((category) => category.count).sort((a, b) => b.height - a.height || b.value - a.value);

		this.treemap(root);

		const leaves = this.cells.selectAll('.cells > g').data(root.leaves(), ({data}) => data.name);

		leaves.attrs({
			transform: (d) => `translate(${d.x0}, ${d.y0})`,
		});

		leaves.select('rect').attrs({
			width: (d) => d.x1 - d.x0,
			height: (d) => d.y1 - d.y0,
			fill: (d, index) => this.colorScale(index),
		});

		leaves.select('text').text(({data}) => data.name).attrs({
			x: (d) => d.x1 - d.x0 - 3,
			y: (d) => d.y1 - d.y0 - 3,
		});

		leaves.each((d) => {
			const area = areaMap.get(d.data.name);

			if (area) {
				area.resize({
					width: d.x1 - d.x0,
					height: d.y1 - d.y0,
				});
			}
		});

		const newLeaves = leaves.enter().append('g').attrs({
			transform: (d) => `translate(${d.x0}, ${d.y0})`,
		}).styles({
			transition: 'all 0.5s',
		});

		newLeaves.append('rect').attrs({
			width: (d) => d.x1 - d.x0,
			height: (d) => d.y1 - d.y0,
			fill: (d, index) => this.colorScale(index),
			id: ({data}) => `rect-${data.id}`,
			class: 'animated zoomIn',
		}).styles({
			transition: 'all 0.5s',
			'animation-duration': '0.5s',
		});

		newLeaves.append('clipPath').attrs({
			id: ({data}) => `clip-${data.id}`,
		}).append('use').attrs({
			'xlink:href': ({data}) => `#rect-${data.id}`,
		});

		newLeaves.append('text').text(({data}) => data.name).attrs({
			'clip-path': ({data}) => `url(#clip-${data.id})`,
			'text-anchor': 'end',
			'font-size': 16,
			fill: '#333',
			class: 'exo-2',
			x: (d) => d.x1 - d.x0 - 3,
			y: (d) => d.y1 - d.y0 - 3,
		}).styles({
			'text-transform': 'uppercase',
		});

		newLeaves.append('g').attrs({
			'clip-path': ({data}) => `url(#clip-${data.id})`,
		}).each(function (d) {
			let emojiMode = 'twitter';

			if (mode === 'device') {
				if (d.data.name.match(/android/i)) {
					emojiMode = 'google';
				}

				if (d.data.name.match(/(ios|iphone|ipad)/i)) {
					emojiMode = 'apple';
				}
			}

			areaMap.set(d.data.name, new TreeMapArea({
				node: this,
				width: d.x1 - d.x0,
				height: d.y1 - d.y0,
				emojiMode,
				onEmojiMouseOver: handleEmojiMouseOver,
				onEmojiMouseLeave: handleEmojiMouseLeave,
				onClickEmoji,
			}));
		});

		const exitLeaves = leaves.exit();
		exitLeaves.each(function (d) {
			const exitLeaf = D3.select(this);

			exitLeaf.select('rect').attrs({
				class: 'animated zoomOut',
			}).styles({
				'animation-duration': '0.5s',
			}).on('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', () => {
				exitLeaf.remove();
			});

			exitLeaf.select('text').remove();

			areaMap.get(d.data.name).clear();
			areaMap.delete(d.data.name);
		});
	}

	showTweets({tweets, time}) {
		for (const tweet of tweets) {
			if (this.areaMap.has(tweet.entry)) {
				this.areaMap.get(tweet.entry).showTweet(tweet);
			}
		}
	}
};
