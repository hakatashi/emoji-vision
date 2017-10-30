const tar = require('tar');
const unbzip2 = require('unbzip2-stream');
const concatStream = require('concat-stream');
const path = require('path');
const fs = require('fs');

const TAR_PATH = path.join(process.env.HOME, 's3/EEICinfovis/archiveteam-twitter-stream-2017-06.tar');

const reader = fs.createReadStream(TAR_PATH);
const parser = new tar.Parse();

parser.on('entry', (entry) => {
	if (entry.type !== 'File') {
		entry.resume();
		return;
	}

	const extracter = unbzip2();
	const concatter = concatStream((data) => {
		const tweetBlobs = data.toString().split('\n');

		const tweets = tweetBlobs.map((tweetBlob) => {
			try {
				return JSON.parse(tweetBlob);
			} catch (error) {
				console.error(error);
				return null;
			}
		}).filter(Boolean);

		console.log(entry.path, tweets.length);
	});

	entry.pipe(extracter).pipe(concatter);
});

reader.pipe(parser);
