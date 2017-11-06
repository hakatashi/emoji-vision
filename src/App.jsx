const React = require('react');

const worldMap = require('./world-map.js');

module.exports = class App extends React.Component {
	componentDidMount() {
		worldMap(this.map);
	}

	render() {
		const scaleWidth = 800;
		const scaleHeight = 60;
		const subScaleNumbers = 6;

		return (
			<div className="app">
				<div className="controls">
					<div className="slider">
						<div className="scale-wrap">
							<svg className="scale" viewBox={`0 0 ${scaleWidth} ${scaleHeight}`}>
								<line
									x1="0"
									y1={scaleHeight / 2}
									x2={scaleWidth}
									y2={scaleHeight / 2}
									width="0.5"
									stroke="white"
								/>
								{Array(12 * subScaleNumbers + 1).fill().map((_, index) => {
									const height = index % subScaleNumbers === 0 ? 15 : 5;
									const x = scaleWidth / (12 * subScaleNumbers) * index;

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
								{Array(12 + 1).fill().map((_, index) => {
									const x = scaleWidth / 12 * index;

									return (
										<text
											key={index}
											x={x}
											y={scaleHeight / 2 + 25}
											textAnchor="middle"
											fill="white"
											fontSize="12"
											className="exo-2"
										>
											{((index + 6) % 12 + 1).toString().padStart(2, '0')}
										</text>
									);
								})}
								<text
									x="0"
									y={scaleHeight / 2 - 15}
									textAnchor="middle"
									fill="white"
									fontSize="14"
									className="exo-2"
								>
									2016
								</text>
								<text
									x={scaleWidth / 2}
									y={scaleHeight / 2 - 15}
									textAnchor="middle"
									fill="white"
									fontSize="14"
									className="exo-2"
								>
									2017
								</text>
							</svg>
							<div className="knob"/>
						</div>
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
