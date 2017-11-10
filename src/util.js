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
