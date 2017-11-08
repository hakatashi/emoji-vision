const React = require('react');
const {default: Hammer} = require('react-hammerjs');
const {default: Measure} = require('react-measure');
const classNames = require('classnames');
const CSSTransition = require('react-transition-group/CSSTransition');

const WorldMap = require('./WorldMap.jsx');
const EmojiStat = require('./EmojiStat.jsx');

module.exports = class App extends React.Component {
	constructor(state, props) {
		super(state, props);

		this.state = {
			time: Date.UTC(2017, 5, 2, 6),
			temporalTime: Date.UTC(2017, 5, 2, 6),
			startTime: Date.UTC(2017, 5, 2, 6),
			realScaleWidth: Infinity,
			isSliding: false,
			mode: 'geo',
			isModalShowing: false,
		};
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
			this.setState({startTime: targetTime});
		}
	}

	handleScaleResize = ({bounds}) => {
		this.setState({realScaleWidth: bounds.width});
	}

	handleUpdateTime = (nextTime) => {
		this.setState({time: nextTime, isSliding: false});
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
				<div className="page-layer">
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
							<div className="clock-slot hour" onClick={() => this.setState({isModalShowing: !this.state.isModalShowing})}>
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
						<WorldMap
							startTime={this.state.startTime}
							onUpdateTime={this.handleUpdateTime}
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
				<div className="modal-layer">
					<CSSTransition
						timeout={1000}
						classNames={{
							enter: 'animated fadeInUp',
							exit: 'animated fadeOutDown',
						}}
						in={this.state.isModalShowing}
						mountOnEnter
						unmountOnExit
					>
						<EmojiStat/>
					</CSSTransition>
				</div>
			</div>
		);
	}
};
