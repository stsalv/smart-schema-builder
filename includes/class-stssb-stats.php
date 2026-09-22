<?php
/**
 * Statistics: hit counters per schema (modal opens + downloads by format),
 * public REST endpoint for recording hits, admin UI to list/reset/edit.
 *
 * @package StSalvSmartSchemaBuilder
 * @since   1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Statistics: hit counters per schema and admin management.
 *
 * Tracks per-schema counters (modal opens and downloads by format) in
 * the `_stssb_stats` post meta as JSON. Exposes a public REST endpoint
 * (`POST /stssb/v1/stats-hit`) for recording hits from the front end,
 * and admin ajax handlers for listing, resetting and manually editing
 * the counters in the Statistics admin page.
 *
 * @package StSalvSmartSchemaBuilder
 * @since   1.0.0
 */
class STSSB_Stats {

	/**
	 * Singleton instance.
	 *
	 * @var STSSB_Stats|null
	 */
	private static $instance = null;

	/**
	 * Get the singleton.
	 *
	 * @since 1.0.0
	 * @return STSSB_Stats
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Hook registrations.
	 *
	 * @since 1.0.0
	 */
	private function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
		add_action( 'wp_ajax_stssb_stats_list', array( $this, 'ajax_list' ) );
		add_action( 'wp_ajax_stssb_stats_reset', array( $this, 'ajax_reset' ) );
		add_action( 'wp_ajax_stssb_stats_edit', array( $this, 'ajax_edit' ) );
	}

	/**
	 * Register the public stats-hit REST route.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register_rest_routes() {
		register_rest_route(
			'stssb/v1',
			'/stats-hit',
			array(
				'methods'             => 'POST',
				'permission_callback' => array( $this, 'rest_hit_permission' ),
				'callback'            => array( $this, 'rest_hit' ),
				'args'                => array(
					'schema_id' => array(
						'required'          => true,
						'sanitize_callback' => 'absint',
					),
					'event'     => array(
						'required'          => true,
						'sanitize_callback' => 'sanitize_key',
					),
				),
			)
		);
	}

	/**
	 * Permission callback for the public stats-hit endpoint.
	 *
	 * Published schemas accept hits from anyone (front-end visitors). Draft
	 * schemas require the stssb_edit_schemas capability; guests receive 404 so
	 * we do not leak the existence of draft content.
	 *
	 * @since 1.0.0
	 * @param WP_REST_Request $request Request.
	 * @return true|WP_Error True when allowed, WP_Error otherwise.
	 */
	public function rest_hit_permission( $request ) {
		$id = (int) $request->get_param( 'schema_id' );
		if ( ! $id ) {
			return new WP_Error( 'stssb_invalid_id', 'Invalid schema ID.', array( 'status' => 400 ) );
		}
		$post = get_post( $id );
		if ( ! $post || STSSB_CPT::POST_TYPE !== $post->post_type ) {
			return new WP_Error( 'stssb_not_found', 'Schema not found.', array( 'status' => 404 ) );
		}
		if ( 'publish' !== get_post_status( $post ) && ! current_user_can( 'stssb_edit_schemas' ) ) {
			return new WP_Error( 'stssb_not_found', 'Schema not found.', array( 'status' => 404 ) );
		}
		return true;
	}

	/**
	 * Record a hit: modal_open or download_{pdf,png,json}.
	 *
	 * @since 1.0.0
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error Response or error.
	 */
	public function rest_hit( $request ) {
		$id    = (int) $request->get_param( 'schema_id' );
		$event = (string) $request->get_param( 'event' );
		$post  = get_post( $id );
		if ( ! $post || STSSB_CPT::POST_TYPE !== $post->post_type ) {
			return new WP_Error( 'stssb_not_found', 'Unknown schema', array( 'status' => 404 ) );
		}
		$ok = self::record_hit( $id, $event );
		if ( ! $ok ) {
			return new WP_Error( 'stssb_invalid_event', 'Unknown event', array( 'status' => 400 ) );
		}
		return rest_ensure_response( array( 'ok' => true ) );
	}

	/**
	 * Record a single hit on a schema.
	 *
	 * @since 1.0.0
	 * @param int    $id    Schema post ID.
	 * @param string $event Event key.
	 * @return bool True when recorded.
	 */
	public static function record_hit( $id, $event ) {
		$stats = self::read( $id );
		switch ( $event ) {
			case 'modal_open':
				$stats['modalOpens'] = (int) ( $stats['modalOpens'] ?? 0 ) + 1;
				break;
			case 'download_pdf':
			case 'download_png':
			case 'download_json':
				$format                        = substr( $event, 9 );
				$stats['downloads'][ $format ] = (int) ( $stats['downloads'][ $format ] ?? 0 ) + 1;
				break;
			default:
				return false;
		}
		$stats['lastHit'] = time();
		if ( empty( $stats['firstHit'] ) ) {
			$stats['firstHit'] = $stats['lastHit'];
		}
		update_post_meta( $id, STSSB_CPT::META_STATS, wp_slash( wp_json_encode( $stats ) ) );
		return true;
	}

	/**
	 * Read stats for a schema, falling back to defaults.
	 *
	 * @since 1.0.0
	 * @param int $id Schema post ID.
	 * @return array Stats array.
	 */
	public static function read( $id ) {
		$raw   = (string) get_post_meta( $id, STSSB_CPT::META_STATS, true );
		$stats = json_decode( $raw, true );
		if ( ! is_array( $stats ) ) {
			return STSSB_CPT::get_default_stats();
		}
		$stats['modalOpens'] = (int) ( $stats['modalOpens'] ?? 0 );
		$stats['downloads']  = is_array( $stats['downloads'] ?? null ) ? $stats['downloads'] : array();
		foreach ( array( 'pdf', 'png', 'json' ) as $format ) {
			$stats['downloads'][ $format ] = (int) ( $stats['downloads'][ $format ] ?? 0 );
		}
		$stats['firstHit'] = isset( $stats['firstHit'] ) ? (int) $stats['firstHit'] : 0;
		$stats['lastHit']  = isset( $stats['lastHit'] ) ? (int) $stats['lastHit'] : 0;
		return $stats;
	}

	/**
	 * Admin: list stats for all schemas.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function ajax_list() {
		check_ajax_referer( 'stssb_admin_nonce', 'nonce' );
		if ( ! current_user_can( 'stssb_manage_settings' ) ) {
			wp_send_json_error( array( 'message' => 'Permission denied.' ), 403 );
		}
		$posts = get_posts(
			array(
				'post_type'      => STSSB_CPT::POST_TYPE,
				'posts_per_page' => 200,
				'post_status'    => array( 'publish', 'draft' ),
				'orderby'        => 'title',
				'order'          => 'ASC',
			)
		);
		$rows  = array();
		foreach ( $posts as $p ) {
			$stats  = self::read( $p->ID );
			$rows[] = array(
				'id'         => $p->ID,
				'title'      => $p->post_title,
				'status'     => $p->post_status,
				'editUrl'    => admin_url( 'admin.php?page=' . STSSB_Admin::EDIT_SLUG . '&schema=' . $p->ID ),
				'modalOpens' => $stats['modalOpens'],
				'downloads'  => $stats['downloads'],
				'firstHit'   => $stats['firstHit'] ? date_i18n( get_option( 'date_format' ) . ' H:i', $stats['firstHit'] ) : '',
				'lastHit'    => $stats['lastHit'] ? date_i18n( get_option( 'date_format' ) . ' H:i', $stats['lastHit'] ) : '',
			);
		}
		wp_send_json_success( array( 'rows' => $rows ) );
	}

	/**
	 * Admin: reset stats for a schema.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function ajax_reset() {
		check_ajax_referer( 'stssb_admin_nonce', 'nonce' );
		if ( ! current_user_can( 'stssb_manage_settings' ) ) {
			wp_send_json_error( array( 'message' => 'Permission denied.' ), 403 );
		}
		$id = isset( $_POST['id'] ) ? absint( $_POST['id'] ) : 0;
		if ( ! $id || STSSB_CPT::POST_TYPE !== get_post_type( $id ) ) {
			wp_send_json_error( array( 'message' => 'Invalid schema.' ), 400 );
		}
		update_post_meta( $id, STSSB_CPT::META_STATS, wp_slash( wp_json_encode( STSSB_CPT::get_default_stats() ) ) );
		wp_send_json_success( array( 'id' => $id ) );
	}

	/**
	 * Admin: manually set counters for a schema.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function ajax_edit() {
		check_ajax_referer( 'stssb_admin_nonce', 'nonce' );
		if ( ! current_user_can( 'stssb_manage_settings' ) ) {
			wp_send_json_error( array( 'message' => 'Permission denied.' ), 403 );
		}
		$id = isset( $_POST['id'] ) ? absint( $_POST['id'] ) : 0;
		if ( ! $id || STSSB_CPT::POST_TYPE !== get_post_type( $id ) ) {
			wp_send_json_error( array( 'message' => 'Invalid schema.' ), 400 );
		}
		$stats = self::read( $id );
		if ( isset( $_POST['modalOpens'] ) ) {
			$stats['modalOpens'] = absint( $_POST['modalOpens'] );
		}
		foreach ( array( 'pdf', 'png', 'json' ) as $format ) {
			$key = 'download_' . $format;
			if ( isset( $_POST[ $key ] ) ) {
				$stats['downloads'][ $format ] = absint( $_POST[ $key ] );
			}
		}
		update_post_meta( $id, STSSB_CPT::META_STATS, wp_slash( wp_json_encode( $stats ) ) );
		wp_send_json_success(
			array(
				'id'    => $id,
				'stats' => $stats,
			)
		);
	}
}
