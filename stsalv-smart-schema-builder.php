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

define( 'SSB_VERSION', '1.0.0' );
define( 'SSB_PLUGIN_FILE', __FILE__ );
define( 'SSB_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'SSB_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'SSB_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );

/* ---------- Class autoloader (manual includes for v1) ---------- */
$ssb_includes = array(
	'includes/class-ssb-cpt.php',
	'includes/class-ssb-assets.php',
	'includes/class-ssb-icons.php',
	'includes/class-ssb-render.php',
	'includes/class-ssb-block.php',
	'includes/class-ssb-io.php',
	'includes/class-ssb-stats.php',
	'includes/ssb-template-tags.php',
);
if ( is_admin() ) {
	$ssb_includes[] = 'includes/admin/class-ssb-admin.php';
	$ssb_includes[] = 'includes/admin/class-ssb-admin-assets.php';
}

foreach ( $ssb_includes as $ssb_file ) {
	$ssb_include_path = SSB_PLUGIN_DIR . $ssb_file;
	if ( file_exists( $ssb_include_path ) ) {
		require_once $ssb_include_path;
	}
}

/* ---------- Boot singletons ---------- */
if ( class_exists( 'SSB_CPT' ) ) {
	SSB_CPT::get_instance(); }
if ( class_exists( 'SSB_Assets' ) ) {
	SSB_Assets::get_instance(); }
if ( class_exists( 'SSB_Block' ) ) {
	SSB_Block::get_instance(); }
if ( class_exists( 'SSB_IO' ) ) {
	SSB_IO::get_instance(); }
if ( class_exists( 'SSB_Stats' ) ) {
	SSB_Stats::get_instance(); }
if ( is_admin() ) {
	if ( class_exists( 'SSB_Admin' ) ) {
		SSB_Admin::get_instance(); }
	if ( class_exists( 'SSB_Admin_Assets' ) ) {
		SSB_Admin_Assets::get_instance(); }
}

/* ---------- Activation / deactivation ---------- */
register_activation_hook(
	__FILE__,
	static function () {
		if ( class_exists( 'SSB_CPT' ) ) {
			SSB_CPT::register_post_type();
		}
		ssb_add_capabilities();
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
function ssb_add_capabilities() {
	$role_caps = array(
		'editor'        => array( 'ssb_edit_schemas' ),
		'administrator' => array( 'ssb_edit_schemas', 'ssb_manage_settings' ),
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
