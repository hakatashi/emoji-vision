const React = require('react');
const {default: Hammer} = require('react-hammerjs');
const {default: Measure} = require('react-measure');
const classNames = require('classnames');

const WorldMap = require('./world-map.js');
const client = require('./data-client.js');

module.exports = class App extends React.Component {
	constructor(state, props) {
		super(state, props);

		this.state = {
			time: Date.UTC(2017, 5, 2, 6),
			temporalTime: Date.UTC(2017, 5, 2, 6),
			realScaleWidth: Infinity,
			isLoading: true,
		};

		this.tweetsQueue = [];
	}

	async componentDidMount() {
		this.worldMap = await WorldMap.create(this.map);
		const tweets = await client('selected/geo-tweets/2017/06/02.json');
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
		setInterval(this.handleTimeStep, 50);
	}

	handleTimeStep = () => {
		if (this.state.isLoading) {
			return;
		}

		const nextTime = this.state.time + 1 * 60 * 1000; // +1min
		const showingTweetsIndex = this.tweetsQueue.findIndex((tweet) => tweet.time > nextTime);
		const showingTweets = this.tweetsQueue.slice(0, showingTweetsIndex);
		this.tweetsQueue = this.tweetsQueue.slice(showingTweetsIndex);
		this.worldMap.showTweets({
			tweets: showingTweets,
			time: new Date(nextTime),
		});
		this.setState({time: nextTime});
	}

	handlePanKnob = (event) => {
		const timeStart = Date.UTC(2016, 6, 1);
		const timeEnd = Date.UTC(2017, 6, 1);
		const deltaTime = (timeEnd - timeStart) * event.deltaX / this.state.realScaleWidth;
		const targetTime = Math.max(timeStart, Math.min(this.state.time + deltaTime, timeEnd));
		this.setState({temporalTime: targetTime});

		if (event.eventType === 4 /* INPUT_END */) {
			this.handleTimeleap(targetTime);
		}
	}

	handleScaleResize = ({bounds}) => {
		this.setState({realScaleWidth: bounds.width});
	}

	handleTimeleap = (time) => {
		this.setState({time});
	}

	render() {
		const scaleWidth = 800;
		const scaleHeight = 60;

		const timeStart = Date.UTC(2016, 6, 1);
		const timeEnd = Date.UTC(2017, 6, 1);
		const scaleTimeRatio = (this.state.temporalTime - timeStart) / (timeEnd - timeStart);

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
