const React = require('react');
const {default: Hammer} = require('react-hammerjs');
const {default: Measure} = require('react-measure');
const classNames = require('classnames');
const last = require('lodash/last');

const WorldMap = require('./world-map.js');
const client = require('./data-client.js');

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const getNextFile = ([year, month, day]) => {
	const date = new Date(Date.UTC(year, month - 1, day) + DAY);
	return [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()];
};

module.exports = class App extends React.Component {
	constructor(state, props) {
		super(state, props);

		this.state = {
			time: Date.UTC(2017, 5, 2, 6),
			temporalTime: Date.UTC(2017, 5, 2, 6),
			realScaleWidth: Infinity,
			isLoading: true,
			isSliding: false,
		};

		this.tweetsQueue = [];
		this.isPreloading = false;
		this.loadedFile = null;
		this.preloadSession = null;
	}

	async componentDidMount() {
		this.worldMap = await WorldMap.create(this.map);
		const tweets = await client('selected/geo-tweets/2017/06/02.json');
		this.loadedFile = [2017, 6, 2];
		tweets.forEach((tweet) => {
			tweet.time = Date.parse(tweet.created_at);
		});
		const sortedTweets = tweets.sort((a, b) => {
			const dateA = a.time;
			const dateB = b.time;

			return dateA - dateB;
		});
		this.tweetsQueue = sortedTweets;
		// eslint-disable-next-line react/no-did-mount-set-state
		this.setState({isLoading: false});
		this.initTime();
	}

	initTime() {
		setInterval(this.handleTick, 50);
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
		const [nextYear, nextMonth, nextDay] = getNextFile(this.loadedFile);
		console.info('Preloading', {nextYear, nextMonth, nextDay});

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

		this.loadedFile = [nextYear, nextMonth, nextDay];

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
		const date = new Date(time);
		const tweets = await client([
			'selected',
			'geo-tweets',
			date.getFullYear(),
			(date.getMonth() + 1).toString().padStart(2, '0'),
			`${(date.getDate() - 1).toString().padStart(2, '0')}.json`,
		].join('/')).catch((error) => {
			console.error(error);
			return [];
		});
		this.loadedFile = [date.getFullYear(), date.getMonth() + 1, date.getDate() - 1];
		tweets.forEach((tweet) => {
			tweet.time = Date.parse(tweet.created_at);
		});
		const sortedTweets = tweets.sort((a, b) => {
			const dateA = a.time;
			const dateB = b.time;

			return dateA - dateB;
		});
		this.tweetsQueue = sortedTweets.slice(sortedTweets.findIndex((tweet) => tweet.time > time));
		[sortedTweets[0], this.tweetsQueue[0], last(this.tweetsQueue)].forEach((tweet) => {
			const time = new Date(tweet.time);
			console.log(`${time.toLocaleDateString()} ${[
				time.getHours().toString().padStart(2, '0'),
				time.getMinutes().toString().padStart(2, '0'),
			].join(':')}`);
		});
		// eslint-disable-next-line react/no-did-mount-set-state
		this.setState({isLoading: false});
	}

	render() {
		const scaleWidth = 800;
		const scaleHeight = 60;

		const timeStart = Date.UTC(2016, 6, 1);
		const timeEnd = Date.UTC(2017, 6, 1);
		const scaleTimeRatio = ((this.state.isSliding ? this.state.temporalTime : this.state.time) - timeStart) / (timeEnd - timeStart);

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
				</div>
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
