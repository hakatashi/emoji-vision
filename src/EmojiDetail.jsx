const React = require('react');
const PropTypes = require('prop-types');
const Close = require('react-icons/lib/io/close');
import emojiCodepoints from '../data/emoji_codepoints.json';

const EmojiDetailStat = require('./EmojiDetailStat.js');

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
	}

	componentDidMount() {
		this.initialize();
	}

	componentWillUnmount() {
		this.destroy();
	}

	initialize = () => {
		this.stat = EmojiDetailStat.create(this.stat, {emoji: this.props.emoji});
		// if (this.isDestroyed) {
		// 	return;
		// }
		// this.initTime();
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
						<div
							className="basic-stat exo-2"
							ref={(node) => {
								this.stat = node;
							}}
						/>
					</div>
				</div>
			</div>
		);
	}
};

// {/*{emojiCodepoints[this.props.emoji].name} (/{emojiCodepoints[this.props.emoji].group}/{emojiCodepoints[this.props.emoji].subgroup})*/}
