const azure = require('azure-storage');

module.exports = async (path) => {
	const fileService = azure.createFileService(
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
