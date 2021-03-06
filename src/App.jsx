/* eslint react/no-multi-comp: "off" */

const React = require('react');
const {default: Hammer} = require('react-hammerjs');
const {default: Measure} = require('react-measure');
const CSSTransition = require('react-transition-group/CSSTransition');
const noop = require('lodash/noop');
const PropTypes = require('prop-types');
const classNames = require('classnames');
const Play = require('react-icons/lib/io/play');
const Pause = require('react-icons/lib/io/pause');
const {ShortcutManager, Shortcuts} = require('react-shortcuts');

const WorldMap = require('./WorldMap.jsx');
const TreeMap = require('./TreeMap.jsx');
const EmojiDetail = require('./EmojiDetail.jsx');
const {getTimezoneOffset} = require('./util.js');

const shortcutManager = new ShortcutManager({
	APP: {
		PAUSE: 'space',
		SKIP_FORWARD: 'right',
		SKIP_BACK: 'left',
		BIG_SKIP_FORWARD: 'shift+right',
		BIG_SKIP_BACK: 'shift+left',
	},
});

const Switcher = (props) => {
	const onClick = (event) => {
		props.onClick(props.id, event);
	};

	return (
		<div className={classNames('switcher', props.id, {active: props.active})} onClick={onClick}>{props.children}</div>
	);
};

Switcher.propTypes = {
	onClick: PropTypes.func.isRequired,
	id: PropTypes.string.isRequired,
	children: PropTypes.string.isRequired,
	active: PropTypes.bool.isRequired,
};

const ClockSlot = (props) => {
	const onIncrement = (event) => {
		props.onValueChange(props.id, 'increment', event);
	};

	const onDecrement = (event) => {
		props.onValueChange(props.id, 'decrement', event);
	};

	return (
		<div className={classNames('clock-slot', props.id)}>
			{props.showArrows && (
				<div className="increment" onClick={onIncrement}/>
			)}
			{props.children}
			{props.showArrows && (
				<div className="decrement" onClick={onDecrement}/>
			)}
		</div>
	);
};

ClockSlot.propTypes = {
	onValueChange: PropTypes.func,
	id: PropTypes.string.isRequired,
	showArrows: PropTypes.bool,
	children: PropTypes.string.isRequired,
};

ClockSlot.defaultProps = {
	onValueChange: noop,
	showArrows: false,
};

module.exports = class App extends React.Component {
	constructor(state, props) {
		super(state, props);

		this.state = {
			time: Date.UTC(2017, 5, 2, 6),
			temporalTime: Date.UTC(2017, 5, 2, 6),
			startTime: Date.UTC(2017, 5, 2, 6),
			realScaleWidth: Infinity,
			isSliding: false,
			mode: 'hash',
			isModalShowing: false,
			isPausing: false,
			detailedEmoji: null,
		};

		this.measureScale = noop;

		window.addEventListener('resize', () => {
			this.measureScale();
		});
	}

	static childContextTypes = {
		shortcuts: PropTypes.object.isRequired,
	}

	getChildContext() {
		return {shortcuts: shortcutManager};
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
			this.setState({startTime: targetTime, isSliding: false});
		}
	}

	handleScaleResize = ({bounds}) => {
		this.setState({realScaleWidth: bounds.width});
	}

	handleUpdateTime = (nextTime) => {
		document.body.classList.remove('loading');
		this.setState({time: nextTime});
	}

	handleClickEmoji = (emoji) => {
		this.setState({
			isModalShowing: true,
			detailedEmoji: emoji,
		});
	}

	handleCloseStat = () => {
		this.setState({
			isModalShowing: false,
		});
	}

	handleClickSwitcher = (id) => {
		if (this.state.mode === id) {
			return;
		}

		this.setState({
			mode: id,
			startTime: this.state.time,
		});
	}

	handleClickPauser = () => {
		this.setState({
			isPausing: !this.state.isPausing,
		});
	}

	handleClockValueChange = (unit, direction) => {
		if (this.state.isLoading || this.state.isSliding) {
			return;
		}

		const delta = direction === 'increment' ? 1 : -1;
		const time = new Date(this.state.time);

		if (unit === 'month') {
			time.setMonth(time.getMonth() + delta);
		}

		if (unit === 'day') {
			time.setDate(time.getDate() + delta);
		}

		if (unit === 'hour') {
			time.setHours(time.getHours() + delta);
		}

		const timeStart = Date.UTC(2016, 6, 1);
		const timeEnd = Date.UTC(2017, 6, 1);
		const targetTime = Math.max(timeStart, Math.min(time.getTime(), timeEnd));

		this.setState({startTime: targetTime});
	}

	handleShortcuts = (action) => {
		if (action === 'PAUSE') {
			this.handleClickPauser();
		}
		if (action === 'SKIP_FORWARD') {
			this.handleClockValueChange('hour', 'increment');
		}
		if (action === 'SKIP_BACK') {
			this.handleClockValueChange('hour', 'decrement');
		}
		if (action === 'BIG_SKIP_FORWARD') {
			this.handleClockValueChange('day', 'increment');
		}
		if (action === 'BIG_SKIP_BACK') {
			this.handleClockValueChange('day', 'decrement');
		}
	}

	render() {
		const scaleWidth = 1200;
		const scaleHeight = 60;

		const timeStart = Date.UTC(2016, 6, 1);
		const timeEnd = Date.UTC(2017, 6, 1);
		const time = this.state.isSliding ? this.state.temporalTime : this.state.time;
		const date = new Date(time);
		const scaleTimeRatio = (time - timeStart) / (timeEnd - timeStart);

		return (
			<Shortcuts
				name="APP"
				// eslint-disable-next-line react/forbid-component-props
				className="shortcut-root"
				// eslint-disable-next-line react/jsx-handler-names
				handler={this.handleShortcuts}
			>
				<div className="app">
					<div className="page-layer">
						<div className="controls">
							<div className="slider">
								<div className="scale-wrap">
									<svg className="scale" viewBox={`0 0 ${scaleWidth} ${scaleHeight}`}>
										<Measure bounds onResize={this.handleScaleResize}>
											{({measureRef, measure}) => {
												this.measureScale = measure;
												return (
													<rect
														ref={measureRef}
														x="0"
														y="0"
														width={scaleWidth}
														height={scaleHeight}
														fill="transparent"
													/>
												);
											}}
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
								<ClockSlot id="year" onValueChange={this.handleClockValueChange}>
									{date.getFullYear()}
								</ClockSlot>
								<div className="clock-seperator">/</div>
								<ClockSlot id="month" onValueChange={this.handleClockValueChange} showArrows>
									{(date.getMonth() + 1).toString().padStart(2, '0')}
								</ClockSlot>
								<div className="clock-seperator">/</div>
								<ClockSlot id="day" onValueChange={this.handleClockValueChange} showArrows>
									{date.getDate().toString().padStart(2, '0')}
								</ClockSlot>
								<div className="clock-seperator narrow"/>
								<ClockSlot id="hour" onValueChange={this.handleClockValueChange} showArrows>
									{date.getHours().toString().padStart(2, '0')}
								</ClockSlot>
								<div className="clock-seperator narrow">:</div>
								<ClockSlot id="minute" onValueChange={this.handleClockValueChange}>
									{date.getMinutes().toString().padStart(2, '0')}
									<div className="timezone">
										(UTC{getTimezoneOffset() >= 0 ? '+' : '-'}{Math.abs(getTimezoneOffset())})
									</div>
								</ClockSlot>
							</div>
							<div className="pauser" onClick={this.handleClickPauser}>
								{this.state.isPausing ? <Play/> : <Pause/>}
							</div>
						</div>
						<div className="switchers">
							<Switcher id="geo" onClick={this.handleClickSwitcher} active={this.state.mode === 'geo'}>Geo Location</Switcher>
							<Switcher id="hash" onClick={this.handleClickSwitcher} active={this.state.mode === 'hash'}>Hashtag</Switcher>
							<Switcher id="lang" onClick={this.handleClickSwitcher} active={this.state.mode === 'lang'}>Language</Switcher>
							<Switcher id="device" onClick={this.handleClickSwitcher} active={this.state.mode === 'device'}>Device</Switcher>
						</div>
						{this.state.mode === 'geo' ? ([
							<WorldMap
								key={this.state.mode}
								startTime={this.state.startTime}
								isPausing={this.state.isPausing}
								onUpdateTime={this.handleUpdateTime}
								onClickEmoji={this.handleClickEmoji}
							/>,
						]) : ([
							<TreeMap
								key={this.state.mode}
								startTime={this.state.startTime}
								isPausing={this.state.isPausing}
								onUpdateTime={this.handleUpdateTime}
								onClickEmoji={this.handleClickEmoji}
								mode={this.state.mode}
							/>,
						])}
					</div>
					<div className="modal-layer">
						<CSSTransition
							timeout={500}
							classNames={{
								enter: 'animated fadeInUp',
								exit: 'animated fadeOutDown',
							}}
							in={this.state.isModalShowing}
							mountOnEnter
							unmountOnExit
						>
							<EmojiDetail
								emoji={this.state.detailedEmoji}
								onClickClose={this.handleCloseStat}
							/>
						</CSSTransition>
					</div>
				</div>
			</Shortcuts>
		);
	}
};
