const React = require('react');
const {default: Hammer} = require('react-hammerjs');

const worldMap = require('./world-map.js');

module.exports = class App extends React.Component {
	constructor(state, props) {
		super(state, props);

		this.state = {
			time: Date.UTC(2017, 5, 1),
		};
	}

	componentDidMount() {
		worldMap(this.map);
	}

	handlePanKnob = (event) => {
		console.log(event);
	}

	render() {
		const scaleWidth = 800;
		const scaleHeight = 60;
		const subScaleNumbers = 6;

		const timeStart = Date.UTC(2016, 6, 1);
		const timeEnd = Date.UTC(2017, 6, 1);
		const scaleTimeRatio = (this.state.time - timeStart) / (timeEnd - timeStart);

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
