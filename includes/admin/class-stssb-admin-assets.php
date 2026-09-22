<?php
/**
 * Admin asset registration and enqueue logic.
 *
 * @package StSalvSmartSchemaBuilder
 * @since   1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; }

/**
 * Admin asset registration and enqueue logic.
 *
 * Registers and enqueues the admin script and stylesheet for the React
 * editor. Provides runtime data (AJAX URL, nonces, translations, theme
 * fonts, default config) via wp_localize_script. Assets are loaded only
 * on Smart Schema Builder admin pages.
 *
 * @package StSalvSmartSchemaBuilder
 * @since   1.0.0
 */
class STSSB_Admin_Assets {

	/**
	 * Singleton instance.
	 *
	 * @var STSSB_Admin_Assets|null
	 */
	private static $instance = null;

	/**
	 * Get the singleton.
	 *
	 * @since 1.0.0
	 * @return STSSB_Admin_Assets
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Hook the admin enqueue action.
	 *
	 * @since 1.0.0
	 */
	private function __construct() {
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue' ) );
	}

	/**
	 * Enqueue admin script and style on Smart Schema Builder pages.
	 *
	 * @since 1.0.0
	 * @param string $hook Current admin page hook suffix.
	 * @return void
	 */
	public function enqueue( $hook ) {
		if ( false === strpos( $hook, 'stsalv-smart-schema-builder' ) ) {
			return;
		}

		$asset_file = STSSB_PLUGIN_DIR . 'build/admin.asset.php';
		$asset      = file_exists( $asset_file )
			? require $asset_file
			: array(
				'dependencies' => array(),
				'version'      => STSSB_VERSION,
			);

		wp_enqueue_style( 'wp-components' );
		// Enable the media library modal used by the icon picker.
		wp_enqueue_media();

		wp_enqueue_style(
			'stssb-admin',
			STSSB_PLUGIN_URL . 'build/admin.css',
			array( 'wp-components' ),
			$asset['version']
		);

		wp_enqueue_script(
			'stssb-admin',
			STSSB_PLUGIN_URL . 'build/admin.js',
			array_merge(
				$asset['dependencies'],
				array(
					'wp-i18n',
					'wp-api-fetch',
					'wp-components',
					'wp-element',
					'wp-data',
					'wp-url',
				)
			),
			$asset['version'],
			true
		);

		wp_set_script_translations( 'stssb-admin', 'stsalv-smart-schema-builder' );

		wp_localize_script(
			'stssb-admin',
			'stssbAdmin',
			array(
				'pluginUrl'      => STSSB_PLUGIN_URL,
				'restNonce'      => wp_create_nonce( 'wp_rest' ),
				'adminNonce'     => wp_create_nonce( 'stssb_admin_nonce' ),
				'themeFonts'     => STSSB_Render::get_theme_fonts(),
				'schemaPostType' => STSSB_CPT::POST_TYPE,
				'defaultConfig'  => STSSB_CPT::get_default_config(),
				'ajaxUrl'        => admin_url( 'admin-ajax.php' ),
				'listUrl'        => admin_url( 'admin.php?page=' . STSSB_Admin::MENU_SLUG ),
				'editUrl'        => admin_url( 'admin.php?page=' . STSSB_Admin::MENU_SLUG ),
				'userCan'        => array(
					'edit'   => current_user_can( 'stssb_edit_schemas' ),
					'manage' => current_user_can( 'stssb_manage_settings' ),
				),
			)
		);
	}
}
