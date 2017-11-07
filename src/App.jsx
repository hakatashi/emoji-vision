const React = require('react');
const {default: Hammer} = require('react-hammerjs');
const {default: Measure} = require('react-measure');
const classNames = require('classnames');
const last = require('lodash/last');

const WorldMap = require('./world-map.js');
const TreeMap = require('./tree-map.js');
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

module.exports = class App extends React.Component {
	constructor(state, props) {
		super(state, props);

		this.state = {
			time: Date.UTC(2017, 5, 2, 6),
			temporalTime: Date.UTC(2017, 5, 2, 6),
			realScaleWidth: Infinity,
			isLoading: true,
			isSliding: false,
			mode: 'geo',
		};

		this.tweetsQueue = [];
		this.isPreloading = false;
		this.loadedFile = null;
		this.preloadSession = null;
	}

	async componentDidMount() {
		await this.initWorldMap();
	}

	async componentDidUpdate(prevProps, prevState) {
		if (prevState.mode !== this.state.mode) {
			if (this.state.mode === 'geo') {
				await this.initWorldMap();
			}
			if (this.state.mode === 'tree') {
				this.destroyWorldMap();
				await this.initTreeMap();
			}
		}
	}

	initWorldMap = async () => {
		this.worldMap = await WorldMap.create(this.geoMapNode);
		this.setState({
			isLoading: true,
		});
		const file = timeToFile(this.state.time);
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
		this.tweetsQueue = sortedTweets.slice(sortedTweets.findIndex((tweet) => tweet.time > this.state.time));
		this.initTime();
		this.setState({isLoading: false});
	}

	destroyWorldMap = () => {
		this.destroyTime();
		this.tweetsQueue = [];
		this.isPreloading = false;
		this.loadedFile = null;
		this.preloadSession = null;
	}

	initTreeMap = async () => {
		this.treeMap = await TreeMap.create(this.treeMapNode);
	}

	initTime() {
		this.timeInterval = setInterval(this.handleTick, 50);
	}

	destroyTime() {
		clearInterval(this.timeInterval);
	}

	handleTick = () => {
		if (this.state.isLoading) {
			return;
		}

		const nextTime = (() => {
			// Skip brank intervals longer than 10min
			if (this.tweetsQueue.length !== 0 && this.tweetsQueue[0].time - this.state.time > 10 * MINUTE) {
				return Math.floor(this.tweetsQueue[0].time / MINUTE) * MINUTE;
			}
			return this.state.time + MINUTE;
		})();
		const showingTweetsIndex = this.tweetsQueue.findIndex((tweet) => tweet.time > nextTime);
		const showingTweets = this.tweetsQueue.slice(0, showingTweetsIndex);
		this.tweetsQueue = this.tweetsQueue.slice(showingTweetsIndex);
		this.worldMap.showTweets({
			tweets: showingTweets,
			time: new Date(nextTime),
		});
		this.setState({time: nextTime});

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
		this.tweetsQueue = sortedTweets.slice(sortedTweets.findIndex((tweet) => tweet.time > this.state.time));
	}

	handlePanKnob = (event) => {
		if (this.state.isLoading) {
			return;
		}

		const timeStart = Date.UTC(2016, 6, 1);
		const timeEnd = Date.UTC(2017, 6, 1);
		const deltaTime = (timeEnd - timeStart) * event.deltaX / this.state.realScaleWidth;
		const targetTime = Math.max(timeStart, Math.min(this.state.time + deltaTime, timeEnd));
		this.setState({temporalTime: targetTime, isSliding: true});

		if (event.eventType === 4 /* INPUT_END */) {
			this.handleTimeleap(targetTime);
		}
	}

	handleScaleResize = ({bounds}) => {
		this.setState({realScaleWidth: bounds.width});
	}

	handleTimeleap = async (time) => {
		this.setState({time, isLoading: true, isSliding: false});
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
		const scaleWidth = 800;
		const scaleHeight = 60;

		const timeStart = Date.UTC(2016, 6, 1);
		const timeEnd = Date.UTC(2017, 6, 1);
		const time = this.state.isSliding ? this.state.temporalTime : this.state.time;
		const date = new Date(time);
		const scaleTimeRatio = (time - timeStart) / (timeEnd - timeStart);

		return (
			<div className="app">
				<div className="controls">
					<div className="slider">
						<div className="scale-wrap">
							<svg className="scale" viewBox={`0 0 ${scaleWidth} ${scaleHeight}`}>
								<Measure bounds onResize={this.handleScaleResize}>
									{({measureRef}) => (
										<rect
											ref={measureRef}
											x="0"
											y="0"
											width={scaleWidth}
											height={scaleHeight}
											fill="transparent"
										/>
									)}
								</Measure>
								<line
									x1="0"
									y1={scaleHeight / 2}
									x2={scaleWidth}
									y2={scaleHeight / 2}
									width="0.5"
									stroke="white"
								/>
								{/* Major Scales */}
								{Array(12 + 1).fill().map((_, index) => {
									const height = 15;
									const time = Date.UTC(2016, 6 + index, 1);
									const x = scaleWidth * (time - timeStart) / (timeEnd - timeStart);

									return [
										<line
											key={`scale-${index}`}
											x1={x}
											y1={scaleHeight / 2 - height / 2}
											x2={x}
											y2={scaleHeight / 2 + height / 2}
											width="0.5"
											stroke="white"
										/>,
										<text
											key={`month-${index}`}
											x={x}
											y={scaleHeight / 2 + 25}
											textAnchor="middle"
											fill="white"
											fontSize="12"
											className="exo-2"
										>
											{((index + 6) % 12 + 1).toString().padStart(2, '0')}
										</text>,
										...((index % 6 === 0 && index !== 12) ? [
											<text
												key={`year-${index}`}
												x={x}
												y={scaleHeight / 2 - 15}
												textAnchor="middle"
												fill="white"
												fontSize="14"
												className="exo-2"
											>
												{index === 0 ? 2016 : 2017}
											</text>,
										] : []),
									];
								})}
								<Hammer onPan={this.handlePanKnob} >
									<rect
										x={scaleWidth * scaleTimeRatio - 4}
										y={scaleHeight / 2 - 10}
										width="8"
										height="20"
										fill="#222"
										strokeWidth="1.5"
										stroke="white"
										style={{cursor: 'pointer'}}
									/>
								</Hammer>
							</svg>
						</div>
					</div>
					<div className="clock exo-2">
						<div className="clock-slot year">
							<div className="increment"/>
							{date.getFullYear()}
							<div className="decrement"/>
						</div>
						<div className="clock-seperator">/</div>
						<div className="clock-slot month">
							<div className="increment"/>
							{(date.getMonth() + 1).toString().padStart(2, '0')}
							<div className="decrement"/>
						</div>
						<div className="clock-seperator">/</div>
						<div className="clock-slot day">
							<div className="increment"/>
							{date.getDate().toString().padStart(2, '0')}
							<div className="decrement"/>
						</div>
						<div className="clock-seperator narrow"/>
						<div className="clock-slot hour">
							<div className="increment"/>
							{date.getHours().toString().padStart(2, '0')}
							<div className="decrement"/>
						</div>
						<div className="clock-seperator narrow">:</div>
						<div className="clock-slot minute" onClick={() => this.setState({mode: this.state.mode === 'geo' ? 'tree' : 'geo'})}>
							<div className="increment"/>
							{date.getMinutes().toString().padStart(2, '0')}
							<div className="decrement"/>
						</div>
					</div>
				</div>
				{this.state.mode === 'geo' && (
					<div
						className={classNames('map', {loading: this.state.isLoading})}
						ref={(node) => {
							this.geoMapNode = node;
						}}
					/>
				)}
				{this.state.mode === 'tree' && (
					<div
						className={classNames('tree', {loading: this.state.isLoading})}
						ref={(node) => {
							this.treeMapNode = node;
						}}
					/>
				)}
			</div>
		);
	}
};
