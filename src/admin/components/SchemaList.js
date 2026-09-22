/**
 * Schemas list screen.
 *
 * @package StSalvSmartSchemaBuilder
 * @since   1.0.0
 */
import { useEffect, useState, useCallback } from '@wordpress/element';
import { Button, Spinner, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { listSchemas, deleteSchema, exportSchema, importSchema } from '../utils/api';

/**
 * Schemas list with import/export actions.
 *
 * @since 1.0.0
 * @param {Object}   props        Component props.
 * @param {Function} props.onEdit Callback to open the editor for a schema ID.
 * @param {Function} props.onNew  Callback to open the editor for a new schema.
 * @return {Element} List element.
 */
const SchemaList = ( { onEdit, onNew } ) => {
	const [ schemas, setSchemas ] = useState( [] );
	const [ loading, setLoading ] = useState( true );
	const [ notice, setNotice ] = useState( null );
	const [ importBusy, setImportBusy ] = useState( false );

	const load = useCallback( async () => {
		setLoading( true );
		try {
			const res = await listSchemas();
			setSchemas( res.schemas || [] );
		} catch ( err ) {
			setNotice( { type: 'error', text: err.message } );
		} finally {
			setLoading( false );
		}
	}, [] );

	useEffect( () => {
		load();
	}, [ load ] );

	const handleDelete = async ( id, title ) => {
		// translators: %s: schema title; used in a confirmation dialog.
		const message = __('Delete schema "%s"? This action cannot be undone.', 'stsalv-smart-schema-builder').replace( '%s', title );
		if ( ! window.confirm( message ) ) { // eslint-disable-line no-alert
			return;
		}
		try {
			await deleteSchema( id );
			setNotice( { type: 'success', text: __('Schema deleted.', 'stsalv-smart-schema-builder') } );
			await load();
		} catch ( err ) {
			setNotice( { type: 'error', text: err.message } );
		}
	};

	const handleExport = async ( id ) => {
		try {
			const data = await exportSchema( id );
			const blob = new Blob( [ JSON.stringify( data, null, 2 ) ], { type: 'application/json' } );
			const url = URL.createObjectURL( blob );
			const a = document.createElement( 'a' );
			a.href = url;
			a.download = `schema-${ id }.json`;
			document.body.appendChild( a );
			a.click();
			a.remove();
			URL.revokeObjectURL( url );
		} catch ( err ) {
			setNotice( { type: 'error', text: err.message } );
		}
	};

	const handleImport = async ( event ) => {
		const file = event.target.files && event.target.files[ 0 ];
		if ( ! file ) {
			return;
		}
		setImportBusy( true );
		setNotice( null );
		try {
			const text = await file.text();
			const data = JSON.parse( text );
			if ( ! data || ! data.config ) {
				throw new Error( __('Invalid file: missing "config" field.', 'stsalv-smart-schema-builder') );
			}
			const res = await importSchema( 0, data );
			setNotice( {
				type: 'success',
				// translators: %s: schema title; used in a success toast.
				text: __('Schema "%s" imported.', 'stsalv-smart-schema-builder').replace( '%s', res.title ),
			} );
			await load();
		} catch ( err ) {
			setNotice( { type: 'error', text: err.message } );
		} finally {
			setImportBusy( false );
			event.target.value = '';
		}
	};

	return (
		<div className="stssb-list">
			<div className="stssb-list__header">
				<h1>{ __('Schemas', 'stsalv-smart-schema-builder') }</h1>
				<div className="stssb-list__actions">
					<label className="stssb-import-label button">
						{ importBusy ? <Spinner /> : __('Import', 'stsalv-smart-schema-builder') }
						<input
							type="file"
							accept="application/json,.json"
							disabled={ importBusy }
							onChange={ handleImport }
							style={ { display: 'none' } }
						/>
					</label>
					<Button variant="primary" onClick={ onNew }>
						{ __('Add New', 'stsalv-smart-schema-builder') }
					</Button>
				</div>
			</div>

			{ notice && (
				<Notice
					status={ notice.type }
					isDismissible
					onRemove={ () => setNotice( null ) }
				>
					{ notice.text }
				</Notice>
			) }

			{ loading ? (
				<div className="stssb-list__loading"><Spinner /></div>
			) : schemas.length === 0 ? (
				<div className="stssb-list__empty">
					<p>{ __('No schemas yet. Click "Add New" to create your first schema.', 'stsalv-smart-schema-builder') }</p>
				</div>
			) : (
				<table className="wp-list-table widefat striped stssb-table">
					<thead>
						<tr>
							<th className="stssb-col-id">{ __('ID', 'stsalv-smart-schema-builder') }</th>
							<th className="stssb-col-title">{ __('Smart Schema', 'stsalv-smart-schema-builder') }</th>
							<th className="stssb-col-status">{ __('Status', 'stsalv-smart-schema-builder') }</th>
							<th className="stssb-col-blocks">{ __('Blocks', 'stsalv-smart-schema-builder') }</th>
							<th className="stssb-col-modified">{ __('Modified', 'stsalv-smart-schema-builder') }</th>
							<th className="stssb-col-actions">{ __('Actions', 'stsalv-smart-schema-builder') }</th>
						</tr>
					</thead>
					<tbody>
						{ schemas.map( ( s ) => (
							<tr key={ s.id }>
								<td className="stssb-col-id">{ s.id }</td>
								<td className="stssb-col-title">
									<strong>
										<a
											href="#edit"
											onClick={ ( e ) => { e.preventDefault(); onEdit( s.id ); } }
										>
											{ s.title || __('(no title)', 'stsalv-smart-schema-builder') }
										</a>
									</strong>
								</td>
								<td className="stssb-col-status">
									<span className={ `stssb-status stssb-status--${ s.status }` }>
										{ s.status === 'publish'
											? __('Published', 'stsalv-smart-schema-builder')
											: __('Draft', 'stsalv-smart-schema-builder') }
									</span>
								</td>
								<td className="stssb-col-blocks">{ s.block_count }</td>
								<td className="stssb-col-modified">{ s.modified }</td>
								<td className="stssb-col-actions">
									<Button variant="secondary" isSmall onClick={ () => onEdit( s.id ) }>
										{ __('Edit', 'stsalv-smart-schema-builder') }
									</Button>
									{ ' ' }
									<Button variant="tertiary" isSmall onClick={ () => handleExport( s.id ) }>
										{ __('Export', 'stsalv-smart-schema-builder') }
									</Button>
									{ window.stssbAdmin?.userCan?.manage && (
										<>
											{ ' ' }
											<Button
												variant="tertiary"
												isDestructive
												isSmall
												onClick={ () => handleDelete( s.id, s.title ) }
											>
												{ __('Delete', 'stsalv-smart-schema-builder') }
											</Button>
										</>
									) }
								</td>
							</tr>
						) ) }
					</tbody>
				</table>
			) }
		</div>
	);
};

export default SchemaList;