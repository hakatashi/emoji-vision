const assert = require('assert');
const React = require('react');
const PropTypes = require('prop-types');
const classNames = require('classnames');
const last = require('lodash/last');
const ISO6391 = require('iso-639-1');

const TreeMapChart = require('./TreeMapChart.js');
const client = require('./data-client.js');

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const getNextFile = ([year, month, day]) => {
	const date = new Date(Date.UTC(year, month - 1, day) + DAY);
	return [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()];
};

const timeToFile = (time) => {
	// Consider tweets included in YYYY-MM-DD.json is from MM-DD 5:00 to MM-(DD + 1) 5:00
	const date = new Date(time - 5 * HOUR);
	return [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()];
};

const fileToFileName = ([year, month, day]) => (
	`${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}.json`
);

module.exports = class TreeMap extends React.Component {
	static propTypes = {
		startTime: PropTypes.number.isRequired,
		isPausing: PropTypes.bool.isRequired,
		onUpdateTime: PropTypes.func.isRequired,
		onClickEmoji: PropTypes.func.isRequired,
		mode: PropTypes.oneOf(['hash', 'lang', 'device']).isRequired,
	}

	constructor(state, props) {
		super(state, props);

		this.state = {
			isLoading: true,
		};

		this.time = this.props.startTime;
		this.tweetsQueue = [];
		this.layoutQueue = [];
		this.isPreloading = false;
		this.loadedFile = null;
		this.preloadSession = null;
		this.isDestroyed = false;
	}

	async componentDidMount() {
		await this.initialize();
	}

	componentWillUnmount() {
		this.destroy();
	}

	componentWillReceiveProps(nextProps) {
		if (this.props.startTime !== nextProps.startTime) {
			this.handleTimeleap(nextProps.startTime);
		}

		if (!this.props.isPausing && nextProps.isPausing) {
			this.pause();
		}

		if (this.props.isPausing && !nextProps.isPausing) {
			this.resume();
		}
	}

	initialize = async () => {
		this.chart = await TreeMapChart.create(this.map, {
			onClickEmoji: this.handleClickEmoji,
			mode: this.props.mode,
		});
		if (this.isDestroyed) {
			return;
		}
		this.handleTimeleap(this.time);
		if (!this.props.isPausing) {
			this.initTime();
		}
	}

	destroy = () => {
		this.destroyTime();
		this.tweetsQueue = [];
		this.layoutQueue = [];
		this.isPreloading = false;
		this.loadedFile = null;
		this.preloadSession = null;
		this.isDestroyed = true;
	}

	pause = () => {
		this.destroyTime();
	}

	resume = () => {
		this.initTime();
	}

	initTime() {
		this.timeInterval = setInterval(this.handleTick, 50);
	}

	destroyTime() {
		clearInterval(this.timeInterval);
	}

	handleClickEmoji = (emoji) => {
		this.props.onClickEmoji(emoji);
	}

	handleTick = () => {
		if (this.state.isLoading) {
			return;
		}

		const nextTime = (() => {
			// Skip brank intervals longer than 10min
			if (this.tweetsQueue.length !== 0 && this.tweetsQueue[0].time - this.time > 10 * MINUTE) {
				return Math.floor(this.tweetsQueue[0].time / MINUTE) * MINUTE;
			}
			return this.time + MINUTE;
		})();
		const showingTweetsIndex = this.tweetsQueue.findIndex((tweet) => tweet.time > nextTime);
		const showingTweets = this.tweetsQueue.slice(0, showingTweetsIndex);
		this.tweetsQueue = this.tweetsQueue.slice(showingTweetsIndex);
		this.chart.showTweets({
			tweets: showingTweets,
			time: new Date(nextTime),
		});
		this.props.onUpdateTime(nextTime);
		this.time = nextTime;

		const showingLayoutsIndex = this.layoutQueue.findIndex((layout) => layout.time > nextTime);
		const showingLayouts = this.layoutQueue.slice(0, showingLayoutsIndex);

		if (showingLayouts.length > 0) {
			this.layoutQueue = this.layoutQueue.slice(showingLayoutsIndex);
			this.updateLayout(last(showingLayouts));
		}

		// Preload
		if (!this.isPreloading) {
			if (this.tweetsQueue.length === 0 || last(this.tweetsQueue).time - nextTime < DAY) {
				const session = Symbol('preload session');
				this.preload(session);
				this.preloadSession = session;
			}
		}
	}

	preload = async (session) => {
		this.isPreloading = true;
		const file = getNextFile(this.loadedFile);
		const [nextYear, nextMonth, nextDay] = file;
		console.info(`Preloading ${fileToFileName(file)}...`);

		const data = await client([
			'selected',
			`${this.props.mode}-tweets`,
			nextYear,
			nextMonth.toString().padStart(2, '0'),
			`${nextDay.toString().padStart(2, '0')}.json`,
		].join('/')).catch((error) => {
			console.error(error);
			return {tweets: [], stats: []};
		});
		this.isPreloading = false;

		if (session !== this.preloadSession) {
			return;
		}

		this.loadedFile = file;

		data.tweets.forEach((tweet) => {
			this.normalizeTweet(tweet);
		});
		data.stats.forEach((layout) => {
			this.normalizeLayout(layout);
		});

		const sortedTweets = this.tweetsQueue.concat(data.tweets).sort((a, b) => {
			const dateA = a.time;
			const dateB = b.time;

			return dateA - dateB;
		});
		const sortedStats = this.layoutQueue.concat(data.stats).sort((a, b) => a.time - b.time);

		this.tweetsQueue = sortedTweets.slice(sortedTweets.findIndex((tweet) => tweet.time > this.time));
		this.layoutQueue = sortedStats.slice(sortedStats.findIndex((stat) => stat.time > this.time));
	}

	handleTimeleap = async (time) => {
		this.setState({isLoading: true});

		const session = Symbol('load session');
		this.loadSession = session;

		this.props.onUpdateTime(time);
		this.time = time;
		this.preloadSession = null;
		const file = timeToFile(time);
		const [nextYear, nextMonth, nextDay] = file;

		console.info(`Loading ${fileToFileName(file)}...`);

		const data = await client([
			'selected',
			`${this.props.mode}-tweets`,
			nextYear,
			nextMonth.toString().padStart(2, '0'),
			`${nextDay.toString().padStart(2, '0')}.json`,
		].join('/')).catch((error) => {
			console.error(error);
			return {tweets: [], stats: []};
		});

		if (session !== this.loadSession) {
			return;
		}

		this.loadedFile = file;

		data.tweets.forEach((tweet) => {
			this.normalizeTweet(tweet);
		});
		data.stats.forEach((layout) => {
			this.normalizeLayout(layout);
		});

		const sortedTweets = data.tweets.sort((a, b) => {
			const dateA = a.time;
			const dateB = b.time;

			return dateA - dateB;
		});
		const sortedStats = data.stats.sort((a, b) => a.time - b.time);

		this.tweetsQueue = sortedTweets.slice(sortedTweets.findIndex((tweet) => tweet.time > time));
		const layoutQueueIndex = sortedStats.findIndex((stat) => stat.time > time);
		this.layoutQueue = sortedStats.slice(layoutQueueIndex);

		if (sortedStats.length > 0) {
			this.updateLayout(sortedStats[layoutQueueIndex - 1] || sortedStats[0]);
		}
		this.setState({isLoading: false});
	}

	normalizeTweet(tweet) {
		tweet.time = new Date(tweet.created_at);

		if (this.props.mode === 'hash') {
			tweet.entry = `#${tweet.hashtag}`;
			return;
		}

		if (this.props.mode === 'lang') {
			if (tweet.lang === 'und') {
				tweet.entry = '(No Language)';
			} else if (tweet.lang === 'in') {
				tweet.entry = ISO6391.getNativeName('id');
			} else {
				tweet.entry = ISO6391.getNativeName(tweet.lang);
			}
			return;
		}

		assert(this.props.mode === 'device');
		tweet.entry = tweet.source.replace(/(^<.+?>|<.+?$)/g, '');
	}

	normalizeLayout(layout) {
		layout.time = layout.created_at * 1000;

		if (this.props.mode === 'hash') {
			layout.entries = Object.entries(layout.hashtag).map(([name, count]) => ({name: `#${name}`, count}));
			return;
		}

		if (this.props.mode === 'lang') {
			layout.entries = Object.entries(layout.lang).map(([name, count]) => {
				if (name === 'und') {
					return {name: '(No Language)', count};
				}
				if (name === 'in') {
					return {name: ISO6391.getNativeName('id'), count};
				}
				return {name: ISO6391.getNativeName(name), count};
			});
			return;
		}

		assert(this.props.mode === 'device');
		layout.entries = Object.entries(layout.source).map(([name, count]) => ({
			name: name.replace(/(^<.+?>|<.+?$)/g, ''),
			count,
		}));
	}

	updateLayout(layout) {
		this.chart.updateLayout(layout.entries);
	}

	render() {
		return (
			<div className="map-wrapper">
				{this.state.isLoading && (
					<div className="spinner-wrapper">
						<div className="three-quarters-loader"/>
					</div>
				)}
				<div
					className={classNames('map', {loading: this.state.isLoading})}
					ref={(node) => {
						this.map = node;
					}}
				/>
			</div>
		);
	}
};
