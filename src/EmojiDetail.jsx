const React = require('react');
const PropTypes = require('prop-types');
const Close = require('react-icons/lib/io/close');
const classNames = require('classnames');
import emojiCodepoints from '../data/emoji_codepoints.json';

const client = require('./data-client.js');

const EmojiDetailTimeChart = require('./EmojiDetailTimeChart.js');
const EmojiDetailPieChart = require('./EmojiDetailPieChart.js');
const ranking = require('./ranking.js');
const {getFileName} = require('./util.js');

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

	getRankingIndex = () => (
		ranking.findIndex((rank) => rank.name === this.props.emoji)
	)

	getRankingEntry = () => (
		ranking[this.getRankingIndex()]
	)

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
			data,
		});
	};

	destroy = () => {
		this.isDestroyed = true;
	};

	// initTime() {
	// 	this.timeInterval = setInterval(this.handleTick, 50);
	// }

	generateHeaders = () => {
		const cols = ['hashtag', 'counts'];

		return <tr>{cols.map((d) => <th key={d}>{d}</th>)}</tr>;
	};

	generateRows = () => {
		const data = this.state.data.hashtag.entries;

		return data.map((ds) => (
			<tr key={ds[0]}>
				<td>#{ds[0]}</td>
				<td>{ds[1].toLocaleString('latn')}</td>
			</tr>
	   ));
	};

	render() {
		return (
			<div className="emoji-stat">
				<div className="close" onClick={this.props.onClickClose}>
					<Close/>
				</div>
				<div className="content">
					<div className="basic-info">
						<img src={getFileName(this.props.emoji, 'twitter')}/>
						<div className="basic-stat">
							<div className="basic-stat-inner">
								<div className="name">
									{emojiCodepoints[this.props.emoji].name}
								</div>
								<div className="sub-info">
									{[
										this.props.emoji.split('-').map((emoji) => `U+${emoji}`).join(' '),
										emojiCodepoints[this.props.emoji].group,
										emojiCodepoints[this.props.emoji].subgroup,
										`Count: ${this.getRankingEntry().count.toLocaleString('latn')} (#${this.getRankingIndex() + 1})`,
									].join(' / ')}
								</div>
							</div>
						</div>
					</div>
					<div className="detail-stat">
						{!this.state.isInitialized && (
							<div className="spinner-wrapper">
								<div className="three-quarters-loader"/>
							</div>
						)}
						<div
							className={classNames('time-chart', 'exo-2', {initialized: this.state.isInitialized})}
							ref={(node) => {
								this.timeChart = node;
							}}
						/>
						<div className="specific-charts">
							<div
								className={classNames('pie-chart', 'exo-2', {initialized: this.state.isInitialized})}
								ref={(node) => {
									this.langChart = node;
								}}
							/>
							<div
								className={classNames('pie-chart', 'exo-2', {initialized: this.state.isInitialized})}
								ref={(node) => {
									this.deviceChart = node;
								}}
							/>
							<div className={classNames('hashtag-table', 'exo-2', {initialized: this.state.isInitialized})}>
								{this.state.isInitialized && (
									<table>
										<thead>{this.generateHeaders()}</thead>
										<tbody>{this.generateRows()}</tbody>
									</table>)
								}
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
};

// {/*{emojiCodepoints[this.props.emoji].name} (/{emojiCodepoints[this.props.emoji].group}/{emojiCodepoints[this.props.emoji].subgroup})*/}
