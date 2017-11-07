const FileService = require('azure-storage/lib/services/file/fileservice.browser.js');

module.exports = async (path) => {
	const fileService = new FileService(
		process.env.AZURE_STORAGE_ACCOUNT,
		process.env.AZURE_STORAGE_ACCESS_KEY
	);

	const data = await new Promise((resolve, reject) => {
		fileService.getFileToText('data', '', path, (error, text) => {
			if (error) {
				reject(error);
			} else {
				resolve(JSON.parse(text));
			}
		});
	});
	return data;
};
