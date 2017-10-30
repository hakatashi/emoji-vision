const tar = require('tar');
const unbzip2 = require('unbzip2-stream');
const split = require('split');
const EmojiData = require('emoji-data');
const path = require('path');
const fs = require('fs');
const cluster = require('cluster');
const assert = require('assert');
const os = require('os');

const TAR_PATH = path.join(process.env.HOME, 's3/EEICinfovis/archiveteam-twitter-stream-2017-06.tar');

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

	parser.on('entry', (entry) => {
		if (entry.type !== 'File') {
			entry.resume();
			return;
		}

		const filename = path.basename(entry.path, '.json.bz2');
		const fileId = parseInt(filename);

		if (Number.isNaN(fileId)) {
			console.error('Filename invalid:', entry.path);
			return;
		}

		if (fileId % CPUs !== cluster.worker.id) {
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
				tweets.push(...emojis);
			}
		});

		splitter.on('end', () => {
			console.log(entry.path, tweets.length);
		});

		entry.pipe(extracter).pipe(splitter);
	});

	reader.pipe(parser);
}
