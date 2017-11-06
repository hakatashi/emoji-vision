const React = require('react');

const worldMap = require('./world-map.js');

module.exports = class App extends React.Component {
	componentDidMount() {
		worldMap(this.map);
	}

	render() {
		const scaleWidth = 800;
		const scaleHeight = 100;

		return (
			<div className="app">
				<div className="controls">
					<div className="slider">
						<svg className="scale" viewBox={`0 0 ${scaleWidth} ${scaleHeight}`}>
							<line
								x1="0"
								y1={scaleHeight / 2}
								x2={scaleWidth}
								y2={scaleHeight / 2}
								width="0.5"
								stroke="white"
							/>
							{Array(12 * 4 + 1).fill().map((_, index) => {
								const height = index % 4 === 0 ? 15 : 5;
								const x = scaleWidth / (12 * 4) * index;

								return (
									<line
										key={index}
										x1={x}
										y1={scaleHeight / 2 - height / 2}
										x2={x}
										y2={scaleHeight / 2 + height / 2}
										width="0.5"
										stroke="white"
									/>
								);
							})}
						</svg>
						<div className="knob"/>
					</div>
				</div>
				<div
					className="map"
					ref={(node) => {
						this.map = node;
					}}
				/>
			</div>
		);
	}
};
