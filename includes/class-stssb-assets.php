<?php
/**
 * Front-end asset registration and enqueue logic.
 *
 * @package StSalvSmartSchemaBuilder
 * @since   1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Front-end asset registration and enqueue logic.
 *
 * Registers and enqueues the front-end script and stylesheet for schema
 * rendering. Provides runtime data (AJAX URL, nonces, translations) via
 * wp_localize_script. Handles late-render fallback when wp_head already fired.
 *
 * @package StSalvSmartSchemaBuilder
 * @since   1.0.0
 */
class STSSB_Assets {

	/**
	 * Singleton instance.
	 *
	 * @var STSSB_Assets|null
	 */
	private static $instance = null;

	/**
	 * Cached webpack asset meta.
	 *
	 * @var array|null
	 */
	private static $asset = null;

	/**
	 * Get the singleton.
	 *
	 * @since 1.0.0
	 * @return STSSB_Assets
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Hook registration.
	 *
	 * @since 1.0.0
	 */
	private function __construct() {
		// Register handles early so they exist in admin/editor contexts too:
		// the editor iframe collects block styles by handle name.
		add_action( 'init', array( $this, 'register' ), 20 );
		add_action( 'wp_enqueue_scripts', array( $this, 'maybe_enqueue' ), 20 );
	}

	/**
	 * Read webpack asset meta for the front-end bundle.
	 *
	 * @since 1.0.0
	 * @return array Asset dependencies and version.
	 */
	private static function asset() {
		if ( null === self::$asset ) {
			$file        = STSSB_PLUGIN_DIR . 'build/frontend.asset.php';
			self::$asset = file_exists( $file )
				? require $file
				: array(
					'dependencies' => array(),
					'version'      => STSSB_VERSION,
				);
		}
		return self::$asset;
	}

	/**
	 * Register front-end script and style handles.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register() {
		$asset = self::asset();
		wp_register_script( 'stssb-frontend', STSSB_PLUGIN_URL . 'build/frontend.js', $asset['dependencies'], $asset['version'], true );
		wp_register_style( 'stssb-frontend', STSSB_PLUGIN_URL . 'build/frontend.css', array(), $asset['version'] );
		wp_set_script_translations( 'stssb-frontend', 'stsalv-smart-schema-builder' );
	}

	/**
	 * Enqueue upfront when the current singular page contains a schema
	 * shortcode or block, so the stylesheet reaches the document head.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function maybe_enqueue() {
		if ( ! is_singular() ) {
			return;
		}
		$content = (string) get_post_field( 'post_content', get_queried_object_id() );
		if ( false === stripos( $content, '[stsalv_smart_schema' ) && false === strpos( $content, 'wp:stssb/schema' ) ) {
			return;
		}
		self::enqueue_frontend();
	}

	/**
	 * Enqueue script and style, localize runtime data.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public static function enqueue_frontend() {
		wp_enqueue_script( 'stssb-frontend' );
		wp_enqueue_style( 'stssb-frontend' );
		wp_localize_script(
			'stssb-frontend',
			'stssbFront',
			array(
				'ajaxUrl'     => admin_url( 'admin-ajax.php' ),
				'nonce'       => wp_create_nonce( 'stssb_public' ),
				'restUrl'     => esc_url_raw( rest_url( 'stssb/v1/' ) ),
				'restNonce'   => wp_create_nonce( 'wp_rest' ),
				'downloadUrl' => add_query_arg( 'ver', self::asset( 'version' ), STSSB_PLUGIN_URL . 'build/download.js' ),
			)
		);
	}

	/**
	 * Guarantee assets at render time. Returns a late <link> tag when the
	 * stylesheet can no longer be printed in the document head.
	 *
	 * @since 1.0.0
	 * @return string Late link tag or empty string.
	 */
	public static function ensure_frontend() {
		wp_enqueue_script( 'stssb-frontend' );
		wp_localize_script(
			'stssb-frontend',
			'stssbFront',
			array(
				'ajaxUrl'     => admin_url( 'admin-ajax.php' ),
				'nonce'       => wp_create_nonce( 'stssb_public' ),
				'restUrl'     => esc_url_raw( rest_url( 'stssb/v1/' ) ),
				'restNonce'   => wp_create_nonce( 'wp_rest' ),
				'downloadUrl' => add_query_arg( 'ver', self::asset( 'version' ), STSSB_PLUGIN_URL . 'build/download.js' ),
			)
		);
		if ( wp_style_is( 'stssb-frontend', 'enqueued' ) || wp_style_is( 'stssb-frontend', 'done' ) ) {
			return '';
		}
		if ( ! did_action( 'wp_head' ) ) {
			wp_enqueue_style( 'stssb-frontend' );
			return '';
		}
		$asset = self::asset();
		return '<style id="stssb-frontend-late-css">@import url("' . esc_url( add_query_arg( 'ver', $asset['version'], STSSB_PLUGIN_URL . 'build/frontend.css' ) ) . '");</style>'; // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedStylesheet -- late-render fallback when wp_head already fired.
	}
}
