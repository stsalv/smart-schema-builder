<?php
/**
 * Plugin Name:       StSalv Smart Schema Builder
 * Plugin URI:        https://stsalv.ru/smart-schema-builder/
 * Description:       Build, manage and publish interactive role/process schema maps with filters, modal descriptions and PDF/PNG/JSON exports.
 * Version:           1.0.0
 * Requires at least: 6.4
 * Requires PHP:      7.4
 * Author:            stsalv
 * Author URI:        https://stsalv.ru/
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       stsalv-smart-schema-builder
 * Domain Path:       /languages
 *
 * @package SmartSchemaBuilder
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'STSSB_VERSION', '1.0.0' );
define( 'STSSB_PLUGIN_FILE', __FILE__ );
define( 'STSSB_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'STSSB_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'STSSB_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );

/* ---------- Class autoloader (manual includes for v1) ---------- */
$stssb_includes = array(
	'includes/class-stssb-cpt.php',
	'includes/class-stssb-assets.php',
	'includes/class-stssb-icons.php',
	'includes/class-stssb-render.php',
	'includes/class-stssb-block.php',
	'includes/class-stssb-io.php',
	'includes/class-stssb-stats.php',
	'includes/stssb-template-tags.php',
);
if ( is_admin() ) {
	$stssb_includes[] = 'includes/admin/class-stssb-admin.php';
	$stssb_includes[] = 'includes/admin/class-stssb-admin-assets.php';
}

foreach ( $stssb_includes as $stssb_file ) {
	$stssb_include_path = STSSB_PLUGIN_DIR . $stssb_file;
	if ( file_exists( $stssb_include_path ) ) {
		require_once $stssb_include_path;
	}
}

/* ---------- Boot singletons ---------- */
if ( class_exists( 'STSSB_CPT' ) ) {
	STSSB_CPT::get_instance(); }
if ( class_exists( 'STSSB_Assets' ) ) {
	STSSB_Assets::get_instance(); }
if ( class_exists( 'STSSB_Block' ) ) {
	STSSB_Block::get_instance(); }
if ( class_exists( 'STSSB_IO' ) ) {
	STSSB_IO::get_instance(); }
if ( class_exists( 'STSSB_Stats' ) ) {
	STSSB_Stats::get_instance(); }
if ( is_admin() ) {
	if ( class_exists( 'STSSB_Admin' ) ) {
		STSSB_Admin::get_instance(); }
	if ( class_exists( 'STSSB_Admin_Assets' ) ) {
		STSSB_Admin_Assets::get_instance(); }
}

/* ---------- Activation / deactivation ---------- */
register_activation_hook(
	__FILE__,
	static function () {
		if ( class_exists( 'STSSB_CPT' ) ) {
			STSSB_CPT::register_post_type();
		}
		stssb_add_capabilities();
		flush_rewrite_rules();
	}
);

register_deactivation_hook(
	__FILE__,
	static function () {
		flush_rewrite_rules();
	}
);

/**
 * Grant plugin capabilities to editor/administrator roles.
 */
function stssb_add_capabilities() {
	$role_caps = array(
		'editor'        => array( 'stssb_edit_schemas' ),
		'administrator' => array( 'stssb_edit_schemas', 'stssb_manage_settings' ),
	);
	foreach ( $role_caps as $role_name => $caps ) {
		$role_obj = get_role( $role_name );
		if ( ! $role_obj ) {
			continue;
		}
		foreach ( $caps as $cap ) {
			$role_obj->add_cap( $cap );
		}
	}
}
