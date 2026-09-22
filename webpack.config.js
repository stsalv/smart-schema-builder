/**
 * Webpack config: explicit entry point names,
 * so that build/ contains admin.js, block.js, frontend.js.
 */
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

module.exports = {
	...defaultConfig,
	entry: {
		admin: './src/admin/index.js',
		'block/index': './src/block/index.js',
		frontend: './src/frontend/index.js',
		download: './src/frontend/download.js',
	},
	module: {
		...defaultConfig.module,
		rules: [
			...defaultConfig.module.rules,
			{
				test: /jspdf[\\/]dist[\\/].*\.js$/,
				loader: 'string-replace-loader',
				options: {
					search: 'https://cdnjs.cloudflare.com/ajax/libs/pdfobject/2.1.1/pdfobject.min.js',
					replace: '',
				},
			},
		],
	},
	performance: {
		hints: false, // Lazy-loaded bundles (download.js) are exempt from size warnings.
	},
};