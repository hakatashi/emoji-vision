const tar = require('tar');
const unbzip2 = require('unbzip2-stream');
const split = require('split');
const EmojiData = require('emoji-data');
const mkdirp = require('mkdirp');
const path = require('path');
const fs = require('fs');
const cluster = require('cluster');
const assert = require('assert');
const os = require('os');
const {promisify} = require('util');

const TAR_PATH = path.join(process.env.HOME, 'A_D4/archiveteam-twitter-stream-2017-05.tar');

if (cluster.isMaster) {
	const CPUs = os.cpus().length;

	for (let i = 0; i < CPUs; i++) {
		cluster.fork();
	}

	cluster.on('exit', (worker) => {
		console.log(`Worker ${worker.process.pid} died`);
	});
}


if (cluster.isWorker) {
	console.log(`Worker ${cluster.worker.id} (pid = ${process.pid}) started`);

	const CPUs = os.cpus().length;

	const reader = fs.createReadStream(TAR_PATH);
	const parser = new tar.Parse();

	let running = !process.env.FROM;
	let skippedEntries = 0;

	parser.on('entry', (entry) => {
		if (entry.type !== 'File') {
			entry.resume();
			return;
		}

		if (!running && !entry.path.startsWith(process.env.FROM)) {
			skippedEntries++;
			if (skippedEntries % 1000 === 0) {
				console.log(`(id = ${cluster.worker.id}) ${skippedEntries} entries skipped`);
			}
			entry.resume();
			return;
		}

		running = true;

		const filename = path.basename(entry.path, '.json.bz2');
		const fileId = parseInt(filename);

		if (Number.isNaN(fileId)) {
			console.error('Filename invalid:', entry.path);
			return;
		}

		if (fileId % CPUs !== cluster.worker.id % CPUs) {
			entry.resume();
			return;
		}

		const tweets = [];

		const extracter = unbzip2();
		const splitter = split();

		splitter.on('data', (data) => {
			if (data.length === 0) {
				return;
			}

			const tweet = (() => {
				try {
					return JSON.parse(data);
				} catch (error) {
					console.error(error);
					return null;
				}
			})();

			if (tweet === null) {
				return;
			}

			const emojis = EmojiData.scan(tweet.text);

			if (emojis.length > 0) {
				tweets.push({
					created_at: tweet.created_at,
					id_str: tweet.id_str,
					source: tweet.source,
					user_id_str: tweet.user.id_str,
					user_followers_count: tweet.user.followers_count,
					user_friends_count: tweet.user.friends_count,
					user_statuses_count: tweet.user.statuses_count,
					user_lang: tweet.user.lang,
					user_utc_offset: tweet.user.utc_offset,
					user_screen_name: tweet.user.screen_name,
					source: tweet.source,
					text: tweet.text,
					in_reply_to_status_id_str: tweet.in_reply_to_status_id_str,
					geo: tweet.geo,
					coordinates: tweet.coordinates,
					place: tweet.place,
					retweeted_status_id_str: tweet.retweeted_status ? tweet.retweeted_status.id_str : null,
					quoted_status_id_str: tweet.quoted_status_id_str,
					entities_hashtags: tweet.entities.hashtags,
					entities_urls: tweet.entities.urls,
					lang: tweet.lang,
					timestamp_ms: tweet.timestamp_ms,
					emojis: emojis.map((emoji) => ({
						unified: emoji.unified,
						short_name: emoji.short_name,
					})),
				});
			}
		});

		splitter.on('end', async () => {
			const outputDir = path.join('data', path.dirname(entry.path));
			const outputPath = path.join(outputDir, `${fileId.toString().padStart(2, '0')}.json`);

			await new Promise((resolve, reject) => {
				mkdirp(outputDir, (error) => {
					if (error) {
						reject(error);
					} else {
						resolve();
					}
				});
			});

			await promisify(fs.writeFile)(outputPath, JSON.stringify(tweets));

			console.log(entry.path, tweets.length);
		});

		entry.pipe(extracter).pipe(splitter);
	});

	reader.pipe(parser);
}
