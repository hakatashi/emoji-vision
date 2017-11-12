const React = require('react');
const PropTypes = require('prop-types');
const classNames = require('classnames');
const last = require('lodash/last');

const WorldMapChart = require('./WorldMapChart.js');
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

module.exports = class WorldMap extends React.Component {
	static propTypes = {
		startTime: PropTypes.number.isRequired,
		onUpdateTime: PropTypes.func.isRequired,
		onClickEmoji: PropTypes.func.isRequired,
	}

	constructor(state, props) {
		super(state, props);

		this.state = {
			isLoading: true,
		};

		this.time = this.props.startTime;
		this.tweetsQueue = [];
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
	}

	initialize = async () => {
		this.chart = await WorldMapChart.create(this.map, {
			onClickEmoji: this.handleClickEmoji,
		});
		if (this.isDestroyed) {
			return;
		}
		this.handleTimeleap(this.time);
		this.initTime();
	}

	destroy = () => {
		this.destroyTime();
		this.tweetsQueue = [];
		this.isPreloading = false;
		this.loadedFile = null;
		this.preloadSession = null;
		this.isDestroyed = true;
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

		const tweets = await client([
			'selected',
			'geo-tweets',
			nextYear,
			nextMonth.toString().padStart(2, '0'),
			`${nextDay.toString().padStart(2, '0')}.json`,
		].join('/')).catch((error) => {
			console.error(error);
			return [];
		});
		this.isPreloading = false;

		if (session !== this.preloadSession) {
			return;
		}

		this.loadedFile = file;

		tweets.forEach((tweet) => {
			tweet.time = Date.parse(tweet.created_at);
		});
		const sortedTweets = this.tweetsQueue.concat(tweets).sort((a, b) => {
			const dateA = a.time;
			const dateB = b.time;

			return dateA - dateB;
		});
		this.tweetsQueue = sortedTweets.slice(sortedTweets.findIndex((tweet) => tweet.time > this.time));
	}

	handleTimeleap = async (time) => {
		this.setState({isLoading: true});
		this.props.onUpdateTime(time);
		this.time = time;
		this.preloadSession = null;
		const file = timeToFile(time);
		const [nextYear, nextMonth, nextDay] = file;
		console.info(`Loading ${fileToFileName(file)}...`);
		const tweets = await client([
			'selected',
			'geo-tweets',
			nextYear,
			nextMonth.toString().padStart(2, '0'),
			`${nextDay.toString().padStart(2, '0')}.json`,
		].join('/')).catch((error) => {
			console.error(error);
			return [];
		});
		this.loadedFile = file;
		tweets.forEach((tweet) => {
			tweet.time = Date.parse(tweet.created_at);
		});
		const sortedTweets = tweets.sort((a, b) => {
			const dateA = a.time;
			const dateB = b.time;

			return dateA - dateB;
		});
		this.tweetsQueue = sortedTweets.slice(sortedTweets.findIndex((tweet) => tweet.time > time));
		this.setState({isLoading: false});
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
