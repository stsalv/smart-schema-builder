<?php
/**
 * Import/export helpers and the public JSON download endpoint.
 *
 * @package SmartSchemaBuilder
 * @since   1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Import/export helpers and the public JSON download endpoint.
 *
 * Handles schema JSON download for guests via the public REST route and
 * for logged-in editors via admin-ajax. Draft schemas are downloadable
 * only by users holding the `ssb_edit_schemas` capability; guests and
 * unprivileged users receive 404 for them.
 *
 * @package SmartSchemaBuilder
 * @since   1.0.0
 */
class SSB_IO {

	/**
	 * Singleton instance.
	 *
	 * @var SSB_IO|null
	 */
	private static $instance = null;

	/**
	 * Get the singleton.
	 *
	 * @since 1.0.0
	 * @return SSB_IO
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Hook the public download endpoint.
	 *
	 * @since 1.0.0
	 */
	private function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
		add_action( 'wp_ajax_ssb_download_json', array( $this, 'ajax_download_json' ) );
		add_action( 'wp_ajax_nopriv_ssb_download_json', array( $this, 'ajax_download_json' ) );
	}

	/**
	 * Return a published schema config as a JSON payload.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function ajax_download_json() {
		check_ajax_referer( 'ssb_public', 'nonce' );
		$id     = isset( $_GET['schema_id'] ) ? absint( $_GET['schema_id'] ) : 0;
		$post   = get_post( $id );
		$status = $post ? get_post_status( $post ) : false;
		if ( ! $post || SSB_CPT::POST_TYPE !== $post->post_type || ! $status ) {
			wp_send_json_error( array( 'message' => __( 'Schema not found.', 'stsalv-smart-schema-builder' ) ), 404 );
		}
		if ( 'publish' !== $status && ! current_user_can( 'ssb_edit_schemas' ) ) {
			wp_send_json_error( array( 'message' => __( 'Schema not found.', 'stsalv-smart-schema-builder' ) ), 404 );
		}
		$config = json_decode( (string) get_post_meta( $id, SSB_CPT::META_CONFIG, true ), true );
		if ( ! is_array( $config ) ) {
			$config = array();
		}
		wp_send_json_success(
			array(
				'title'  => $config['title'] ?? $post->post_title,
				'config' => $config,
			)
		);
	}

	/**
	 * Register public REST routes (anonymous admin-ajax is unreliable on
	 * some hosts, REST is the sanctioned public channel).
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register_rest_routes() {
		register_rest_route(
			'ssb/v1',
			'/download-json/(?P<id>\d+)',
			array(
				'methods'             => 'GET',
				'permission_callback' => '__return_true',
				'callback'            => array( $this, 'rest_download_json' ),
				'args'                => array(
					'id' => array(
						'validate_callback' => static function ( $value ) {
							return is_numeric( $value );
						},
						'sanitize_callback' => 'absint',
					),
				),
			)
		);
	}

	/**
	 * REST callback: return the published schema config as JSON.
	 *
	 * @since 1.0.0
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response or error.
	 */
	public function rest_download_json( $request ) {
		$id     = (int) $request->get_param( 'id' );
		$post   = get_post( $id );
		$status = $post ? get_post_status( $post ) : false;
		if ( ! $post || SSB_CPT::POST_TYPE !== $post->post_type || ! $status ) {
			return new WP_Error( 'ssb_not_found', __( 'Schema not found.', 'stsalv-smart-schema-builder' ), array( 'status' => 404 ) );
		}
		// Published schemas are downloadable by everyone. Drafts require the
		// schema editor capability; unauthorized requests still get 404 so
		// we don't leak the existence of draft content.
		if ( 'publish' !== $status && ! current_user_can( 'ssb_edit_schemas' ) ) {
			return new WP_Error( 'ssb_not_found', __( 'Schema not found.', 'stsalv-smart-schema-builder' ), array( 'status' => 404 ) );
		}
		$config = json_decode( (string) get_post_meta( $id, SSB_CPT::META_CONFIG, true ), true );
		if ( ! is_array( $config ) ) {
			$config = array();
		}
		return rest_ensure_response(
			array(
				'title'  => $config['title'] ?? $post->post_title,
				'config' => $config,
			)
		);
	}
}
