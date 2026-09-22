/**
 * Admin app root: switches between the schemas list and the schema editor
 * based on the initial action and the user's navigation.
 *
 * @package StSalvSmartSchemaBuilder
 * @since   1.0.0
 */
import { useState, useCallback } from '@wordpress/element';
import SchemaList from './components/SchemaList';
import SchemaEditor from './components/SchemaEditor';

/**
 * App root component.
 *
 * @since 1.0.0
 * @param {Object} props               Component props.
 * @param {string} props.initialAction Initial action from the URL: list or edit.
 * @param {number} props.initialSchemaId Initial schema post ID (0 for new).
 * @return {Element} Rendered element.
 */
const App = ( { initialAction, initialSchemaId } ) => {
    const [ view, setView ] = useState( {
        action: initialAction === 'edit' ? 'edit' : 'list',
        schemaId: initialAction === 'edit' ? initialSchemaId : 0,
    } );

    /**
     * Switch back to the schemas list view.
     *
     * @since 1.0.0
     * @return {void}
     */
    const openList = useCallback( () => {
        setView( { action: 'list', schemaId: 0 } );
        if ( window.history && window.history.replaceState ) {
            window.history.replaceState( {}, '', window.stssbAdmin?.listUrl || window.location.href );
        }
    }, [] );

    /**
     * Open the editor for a schema (0 = new schema).
     *
     * @since 1.0.0
     * @param {number} id Schema post ID.
     * @return {void}
     */
    const openEditor = useCallback( ( id ) => {
        setView( { action: 'edit', schemaId: id || 0 } );
        const baseUrl = window.stssbAdmin?.editUrl || window.location.href;
        const sep     = baseUrl.indexOf( '?' ) === -1 ? '?' : '&';
        if ( window.history && window.history.replaceState ) {
            window.history.replaceState( {}, '', `${ baseUrl }${ sep }action=edit&schema=${ id || 0 }` );
        }
    }, [] );

    if ( view.action === 'edit' ) {
        return <SchemaEditor schemaId={ view.schemaId } onBack={ openList } />;
    }
    return <SchemaList onEdit={ openEditor } onNew={ () => openEditor( 0 ) } />;
};

export default App;