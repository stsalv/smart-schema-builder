/**
 * Admin entrypoint: mounts the App root on the schemas list/editor page
 * and the StatsPage on the statistics page.
 *
 * Each mountpoint is detected independently so this script can run safely
 * on any admin page (it does nothing where neither element is present).
 *
 * @package SmartSchemaBuilder
 * @since   1.0.0
 */
import { createRoot } from '@wordpress/element';
import App from './App';
import StatsPage from './components/StatsPage';
import './styles/admin.scss';

document.addEventListener( 'DOMContentLoaded', () => {
    // Editor / list page mountpoint (action + optional schemaId).
    const rootEl = document.getElementById( 'ssb-admin-root' );
    if ( rootEl ) {
        const action   = rootEl.dataset.action || 'list';
        const schemaId = parseInt( rootEl.dataset.schemaId || '0', 10 ) || 0;
        createRoot( rootEl ).render( <App initialAction={ action } initialSchemaId={ schemaId } /> );
    }

    // Statistics page mountpoint.
    const statsEl = document.getElementById( 'ssb-stats-root' );
    if ( statsEl ) {
        createRoot( statsEl ).render( <StatsPage /> );
    }
} );