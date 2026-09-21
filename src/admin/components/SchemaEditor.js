/**
 * Schema editor screen: header with save actions and three tabs.
 *
 * @package SmartSchemaBuilder
 * @since   1.0.0
 */
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { Button, Notice, Spinner, TabPanel, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { getSchema, saveSchema } from '../utils/api';
import { normalizeConfig } from '../utils/schema-helpers';
import GeneralSettings from './editor/GeneralSettings';
import BlocksEditor from './editor/BlocksEditor';
import TagsManager from './editor/TagsManager';

/**
 * Schema editor with debounced autosave.
 *
 * @since 1.0.0
 * @param {Object}   props          Component props.
 * @param {number}   props.schemaId Schema post ID (0 for a new schema).
 * @param {Function} props.onBack   Callback to return to the list view.
 * @return {Element} Editor element.
 */
const SchemaEditor = ( { schemaId, onBack } ) => {
	const [ schema, setSchema ] = useState( null );
	const [ loaded, setLoaded ] = useState( false );
	const [ saveState, setSaveState ] = useState( 'saved' );
	const schemaRef = useRef( null );
	const skipAutosave = useRef( true );

	// Keep the ref in sync for callbacks and the autosave timer.
	useEffect( () => {
		schemaRef.current = schema;
	}, [ schema ] );

	// Load schema data (or prepare an empty one) on mount.
	useEffect( () => {
		let cancelled = false;

		/**
		 * Build an empty schema object for new entities.
		 *
		 * @since 1.0.0
		 * @return {Object} Empty schema object.
		 */
		const emptySchema = () => ( {
			id: 0,
			title: '',
			status: 'draft',
			config: normalizeConfig( window.ssbAdmin?.defaultConfig || {} ),
		} );

		setLoaded( false );
		skipAutosave.current = true;

		if ( ! schemaId ) {
			setSchema( emptySchema() );
			setLoaded( true );
			return undefined;
		}

		getSchema( schemaId )
			.then( ( data ) => {
				if ( cancelled ) {
					return;
				}
				setSchema( { ...data, config: normalizeConfig( data?.config ) } );
				setLoaded( true );
			} )
			.catch( () => {
				if ( cancelled ) {
					return;
				}
				setSchema( emptySchema() );
				setLoaded( true );
			} );

		return () => {
			cancelled = true;
		};
	}, [ schemaId ] );

	/**
	 * Persist the schema with a given status.
	 *
	 * @since 1.0.0
	 * @param {string} status Post status: draft or publish.
	 * @return {Promise<void>} Save promise.
	 */
	const doSave = useCallback( async ( status ) => {
		const current = schemaRef.current;
		if ( ! current ) {
			return;
		}
		setSaveState( 'saving' );
		try {
			const result = await saveSchema( {
				id: current.id,
				title: current.title,
				status,
				config: { ...current.config, title: current.title },
			} );
			setSchema( ( prev ) => ( { ...prev, id: result.id, status } ) );
			setSaveState( 'saved' );
			if ( window.history && window.history.replaceState ) {
				const base = window.ssbAdmin?.editUrl || window.location.href;
				const separator = base.indexOf( '?' ) === -1 ? '?' : '&';
				window.history.replaceState( {}, '', `${ base }${ separator }action=edit&schema=${ result.id }` );
			}
		} catch ( error ) {
			setSaveState( 'error' );
		}
	}, [] );

	// Debounced autosave: fires 1.5s after any change for saved schemas.
	useEffect( () => {
		if ( ! loaded || ! schema ) {
			return undefined;
		}
		if ( skipAutosave.current ) {
			skipAutosave.current = false;
			return undefined;
		}
		setSaveState( ( prev ) => ( 'saving' === prev ? prev : 'dirty' ) );
		if ( ! schema.id ) {
			return undefined;
		}
		const timer = setTimeout( () => {
			doSave( schemaRef.current.status );
		}, 1500 );
		return () => clearTimeout( timer );
	}, [ schema?.config, schema?.title, schema?.id, loaded, doSave ] );

	/**
	 * Patch top-level config keys.
	 *
	 * @since 1.0.0
	 * @param {Object} patch Partial config.
	 * @return {void}
	 */
	const patchConfig = useCallback( ( patch ) => {
		setSchema( ( prev ) => ( { ...prev, config: { ...prev.config, ...patch } } ) );
	}, [] );

	/**
	 * Replace the blocks array.
	 *
	 * @since 1.0.0
	 * @param {Array} blocks Next blocks array.
	 * @return {void}
	 */
	const patchBlocks = useCallback(
		( blocks ) => patchConfig( { blocks } ),
		[ patchConfig ]
	);

	/**
	 * Replace the tags array and strip removed tags from all items.
	 *
	 * @since 1.0.0
	 * @param {Array} nextTags Next tags array.
	 * @return {void}
	 */
	const patchTags = useCallback( ( nextTags ) => {
		setSchema( ( prev ) => {
			const removed = ( prev.config.tags || [] )
				.filter( ( tag ) => ! nextTags.some( ( next ) => next.id === tag.id ) )
				.map( ( tag ) => tag.id );
			const blocks = ( prev.config.blocks || [] ).map( ( block ) => ( {
				...block,
				groups: ( block.groups || [] ).map( ( group ) => ( {
					...group,
					items: ( group.items || [] ).map( ( item ) => ( {
						...item,
						tags: ( item.tags || [] ).filter( ( id ) => ! removed.includes( id ) ),
					} ) ),
				} ) ),
			} ) );
			return { ...prev, config: { ...prev.config, tags: nextTags, blocks } };
		} );
	}, [] );

	if ( ! loaded || ! schema ) {
		return (
			<div className="ssb-editor">
				<Spinner />
			</div>
		);
	}

	const saveStateLabels = {
		saved: __('Saved', 'stsalv-smart-schema-builder'),
		dirty: __('Unsaved changes...', 'stsalv-smart-schema-builder'),
		saving: __('Saving...', 'stsalv-smart-schema-builder'),
		error: __('Save error', 'stsalv-smart-schema-builder'),
	};

	return (
		<div className="ssb-editor">
			<header className="ssb-editor__header">
				<Button variant="tertiary" icon="arrow-left-alt2" onClick={ onBack }>
					{ __('Back to list', 'stsalv-smart-schema-builder') }
				</Button>
				<TextControl
					className="ssb-editor__title"
					label={ __('Schema title', 'stsalv-smart-schema-builder') }
					hideLabelFromVision
					placeholder={ __('Schema title', 'stsalv-smart-schema-builder') }
					value={ schema.title }
					onChange={ ( next ) => setSchema( ( prev ) => ( { ...prev, title: next } ) ) }
				/>
				<span className={ `ssb-status ssb-status--${ schema.status }` }>
					{ 'publish' === schema.status
						? __('Published', 'stsalv-smart-schema-builder')
						: __('Draft', 'stsalv-smart-schema-builder') }
				</span>
				<span className={ `ssb-save-state ssb-save-state--${ saveState }` }>
					{ saveStateLabels[ saveState ] }
				</span>
				<span className="ssb-editor__actions">
					<Button variant="secondary" onClick={ () => doSave( 'draft' ) }>
						{ __('Save draft', 'stsalv-smart-schema-builder') }
					</Button>
					<Button variant="primary" onClick={ () => doSave( 'publish' ) }>
						{ 'publish' === schema.status
							? __('Update', 'stsalv-smart-schema-builder')
							: __('Publish', 'stsalv-smart-schema-builder') }
					</Button>
				</span>
			</header>

			{ 'error' === saveState && (
				<Notice status="error" isDismissible={ false }>
					{ __('Could not save the schema. Please try again.', 'stsalv-smart-schema-builder') }
				</Notice>
			) }

			<TabPanel
				className="ssb-tabs"
				tabs={ [
					{ name: 'general', title: __('General', 'stsalv-smart-schema-builder'), className: 'ssb-tab' },
					{ name: 'blocks', title: __('Blocks', 'stsalv-smart-schema-builder'), className: 'ssb-tab' },
					{ name: 'tags', title: __('Tags', 'stsalv-smart-schema-builder'), className: 'ssb-tab' },
				] }
			>
				{ ( tab ) => {
					if ( 'general' === tab.name ) {
						return <GeneralSettings config={ schema.config } onPatch={ patchConfig } />;
					}
					if ( 'blocks' === tab.name ) {
						return (
							<BlocksEditor
								blocks={ schema.config.blocks || [] }
								tags={ schema.config.tags || [] }
								onChange={ patchBlocks }
							/>
						);
					}
					return <TagsManager tags={ schema.config.tags || [] } onChange={ patchTags } />;
				} }
			</TabPanel>
		</div>
	);
};

export default SchemaEditor;