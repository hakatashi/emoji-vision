const React = require('react');

const worldMap = require('./world-map.js');

module.exports = class App extends React.Component {
	componentDidMount() {
		worldMap(this.map);
	}

	render() {
		return (
			<div className="app">
				<div className="map" ref={(node) => { this.map = node; }}/>
			</div>
		)
	}
}
