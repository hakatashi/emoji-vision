const React = require('react');
const PropTypes = require('prop-types');
const Close = require('react-icons/lib/io/close');
import emojiCodepoints from '../data/emoji_codepoints.json';

const EmojiDetailTimeChart = require('./EmojiDetailTimeChart.js');
const EmojiDetailPieChart = require('./EmojiDetailPieChart.js');

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

		this.state = {};

		this.isDestroyed = false;
		this.minuteness = 'slim';
	}

	componentDidMount() {
		this.initialize();
	}

	componentWillUnmount() {
		this.destroy();
	}

	initialize = () => {
		this.timeChart = EmojiDetailTimeChart.create(this.timeChart,
			{emoji: this.props.emoji, minuteness: this.minuteness});
		this.langChart = EmojiDetailPieChart.create(this.langChart,
			{emoji: this.props.emoji, minuteness: this.minuteness, mode: 'lang'});
		this.deviceChart = EmojiDetailPieChart.create(this.deviceChart,
			{emoji: this.props.emoji, minuteness: this.minuteness, mode: 'device'});
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
							className="time-chart exo-2"
							ref={(node) => {
								this.timeChart = node;
							}}
						/>
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
					</div>
				</div>
			</div>
		);
	}
};

// {/*{emojiCodepoints[this.props.emoji].name} (/{emojiCodepoints[this.props.emoji].group}/{emojiCodepoints[this.props.emoji].subgroup})*/}
