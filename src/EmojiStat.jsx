const React = require('react');
const PropTypes = require('prop-types');
const Close = require('react-icons/lib/io/close');

module.exports = class EmojiStat extends React.Component {
	static propTypes = {
		emoji: PropTypes.string.isRequired,
		onClickClose: PropTypes.func.isRequired,
	}

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
						<div className="basic-stat exo-2">
							Tree
						</div>
					</div>
				</div>
			</div>
		);
	}
};
