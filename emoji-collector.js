const tar = require('tar');
const unbzip2 = require('unbzip2-stream');
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

	console.error(entry);

	const extracter = unbzip2();

	entry.pipe(extracter).pipe(process.stdout);
});

reader.pipe(parser);
