const React = require('react');

module.exports = class EmojiStat extends React.Component {
	constructor(state, props) {
		super(state, props);

		this.state = {
		};
	}

	render() {
		return (
			<div className="emoji-stat">
				<div className="close"/>
			</div>
		);
	}
};
