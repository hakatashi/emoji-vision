const D3 = require('d3');

module.exports = async (path) => {
	const data = await new Promise((resolve, reject) => {
		D3.json(`data/${path}`, (error, data) => {
			if (error) {
				reject(error);
			} else {
				resolve(data);
			}
		});
	});
	return data;
};
