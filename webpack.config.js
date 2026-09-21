/**
 * Webpack config: явные имена точек входа,
 * чтобы в build/ лежали admin.js, block.js, frontend.js.
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
	performance: {
		hints: false, // Lazy-loaded bundles (download.js) are exempt from size warnings.
	},
};