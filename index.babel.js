require('babel-polyfill');

require('./index.pcss');

process.on('unhandledRejection', (error) => {
	throw error;
});

window.addEventListener('unhandledrejection', (error) => {
	throw error;
});

const React = require('react');
const ReactDOM = require('react-dom');

const App = require('./src/App.jsx');

const reactRoot = document.querySelector('.root');

ReactDOM.render(React.createElement(App), reactRoot);
