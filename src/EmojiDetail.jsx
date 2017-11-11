const React = require('react');
const PropTypes = require('prop-types');
const Close = require('react-icons/lib/io/close');
import emojiCodepoints from '../data/emoji_codepoints.json';

const EmojiStat = require('./EmojiStat');

module.exports = class EmojiStat extends React.Component {
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
		};
	}

	render() {
		return (
			<div className="emoji-stat">
				<div className="close" onClick={this.props.onClickClose}>
					<Close/>
				</div>
				<div className="content">
					<div className="basic-info">
						<img src={`node_modules/twemoji/2/svg/${this.props.emoji.toLowerCase()}.svg`}/>
						{emojiCodepoints[this.props.emoji].name} (/{emojiCodepoints[this.props.emoji].group}/{emojiCodepoints[this.props.emoji].subgroup})
						<div className="basic-stat exo-2">
							Tree
						</div>
					</div>
				</div>
			</div>
		);
	}
};
