const assert = require('assert');
const ranking = require('./ranking.js');
const reverseRanking = ranking.slice().reverse();

module.exports.selectEmoji = (emojis) => {
	// Select least used emoji
	for (const emoji of reverseRanking) {
		if (emojis.some((e) => e.unified === emoji.name)) {
			return emoji.name;
		}
	}

	return null;
};

module.exports.getFileName = (emoji, category) => {
	const baseUrl = process.env.NODE_ENV === 'production' ? 'https://emojivision.azureedge.net/public/node_modules' : 'node_modules';

	if (category === 'twitter') {
		const basename = emoji.replace(/^00/, '').toLowerCase();
		return `${baseUrl}/twemoji/2/svg/${basename}.svg`;
	}

	if (category === 'google') {
		return `${baseUrl}/noto-emoji%23v2017-05-18-cook-color-fix/svg/emoji_u${emoji.replace(/-/g, '_').toLowerCase()}.svg`;
	}

	assert(category === 'apple');
	return `${baseUrl}/emoji-datasource-apple/img/apple/64/${emoji.toLowerCase()}.png`;
};

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

module.exports.SECOND = SECOND;
module.exports.MINUTE = MINUTE;
module.exports.HOUR = HOUR;
module.exports.DAY = DAY;

module.exports.getTimezoneOffset = () => (
	-new Date().getTimezoneOffset() / 60
);
