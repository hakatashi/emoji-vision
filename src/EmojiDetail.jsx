const React = require('react');
const PropTypes = require('prop-types');
const Close = require('react-icons/lib/io/close');
const classNames = require('classnames');
import emojiCodepoints from '../data/emoji_codepoints.json';
const client = require('./data-client.js');

const EmojiDetailTimeChart = require('./EmojiDetailTimeChart.js');
const EmojiDetailPieChart = require('./EmojiDetailPieChart.js');

const emojiToFileName = ([emoji, minuteness]) => `${minuteness}/${emoji}.json`;

module.exports = class EmojiDetail extends React.Component {
	static propTypes = {
		emoji: PropTypes.string,
		onClickClose: PropTypes.func.isRequired,
	};

	static defaultProps = {
		emoji: null,
	};

	constructor(state, props) {
		super(state, props);

		this.state = {
			isInitialized: false,
		};

		this.isDestroyed = false;
		this.minuteness = 'slim';
	}

	componentDidMount() {
		this.initialize();
	}

	componentWillUnmount() {
		this.destroy();
	}

	initialize = async () => {
		const fileName = emojiToFileName([this.props.emoji, this.minuteness]);

		console.info(`Loading ${fileName}...`);
		const data = await client([
			'statistics',
			fileName,
		].join('/')).catch((error) => {
			console.error(error);
			return {
				count: 0,
				date: {
					entries: [],
					total: 0,
				},
				device: {
					entries: [],
					total: 0,
				},
				group: 'Unknown',
				hashtag: {
					entries: [],
					total: 0,
				},
				name: 'Unknown',
				subgroup: 'Unknown',
			};
		});

		EmojiDetailTimeChart.create(this.timeChart, {data});

		EmojiDetailPieChart.create(this.langChart, {
			data,
			mode: 'lang',
		});

		EmojiDetailPieChart.create(this.deviceChart, {
			data,
			mode: 'device',
		});

		this.setState({
			isInitialized: true,
		});
	};

	destroy = () => {
		this.isDestroyed = true;
	};

	// initTime() {
	// 	this.timeInterval = setInterval(this.handleTick, 50);
	// }

	render() {
		return (
			<div className="emoji-stat">
				<div className="close" onClick={this.props.onClickClose}>
					<Close/>
				</div>
				<div className="content">
					<div className="basic-info">
						<img src={`node_modules/twemoji/2/svg/${this.props.emoji.toLowerCase()}.svg`}/>
						<div className="basic-stat">
							<div className="basic-stat-inner">
								<div className="name">
									{emojiCodepoints[this.props.emoji].name}
								</div>
								<div className="sub-info">
									{emojiCodepoints[this.props.emoji].group} / {emojiCodepoints[this.props.emoji].subgroup}
								</div>
							</div>
						</div>
					</div>
					<div className="detail-stat">
						<div
							className={classNames('time-chart', 'exo-2', {initialized: this.state.isInitialized})}
							ref={(node) => {
								this.timeChart = node;
							}}
						/>
						<div className="specific-charts">
							<div
								className="pie-chart exo-2"
								ref={(node) => {
									this.langChart = node;
								}}
							/>
							<div
								className="pie-chart exo-2"
								ref={(node) => {
									this.deviceChart = node;
								}}
							/>
							<div className="hashtag-table exo-2">
								hashtag
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
};

// {/*{emojiCodepoints[this.props.emoji].name} (/{emojiCodepoints[this.props.emoji].group}/{emojiCodepoints[this.props.emoji].subgroup})*/}
