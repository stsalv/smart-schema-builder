/**
 * Admin: statistics page with table, reset and manual edit.
 *
 * @package StSalvSmartSchemaBuilder
 * @since   1.0.0
 */
import { useEffect, useState } from '@wordpress/element';
import { Button, Spinner, TextControl, Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

const StatsPage = () => {
	const [ rows, setRows ] = useState( null );
	const [ editing, setEditing ] = useState( null );
	const [ draft, setDraft ] = useState( {} );

	/**
	 * Fetch the full stats table from the admin ajax endpoint.
	 *
	 * @since 1.0.0
	 * @return {Promise<void>}
	 */
	const load = async () => {
		const fd = new FormData();
		fd.append( 'action', 'stssb_stats_list' );
		fd.append( 'nonce', window.stssbAdmin.adminNonce );
		const res = await fetch( window.stssbAdmin.ajaxUrl, {
			method: 'POST',
			body: fd,
			credentials: 'same-origin',
		} );
		const json = await res.json();
		setRows( json && json.success ? json.data.rows : [] );
	};

	useEffect( () => {
		load();
	}, [] );

	/**
	 * Reset all counters for a schema.
	 *
	 * @since 1.0.0
	 * @param {number} id Schema ID.
	 * @return {void}
	 */
	const reset = async ( id ) => {
		if ( ! window.confirm( __('Reset all counters for this schema?', 'stsalv-smart-schema-builder') ) ) {
			return;
		}
		const fd = new FormData();
		fd.append( 'action', 'stssb_stats_reset' );
		fd.append( 'nonce', window.stssbAdmin.adminNonce );
		fd.append( 'id', id );
		await fetch( window.stssbAdmin.ajaxUrl, { method: 'POST', body: fd, credentials: 'same-origin' } );
		await load();
	};

	/**
	 * Apply the draft values from the edit modal.
	 *
	 * @since 1.0.0
	 * @return {Promise<void>}
	 */
	const saveEdit = async () => {
		const fd = new FormData();
		fd.append( 'action', 'stssb_stats_edit' );
		fd.append( 'nonce', window.stssbAdmin.adminNonce );
		fd.append( 'id', editing.id );
		fd.append( 'modalOpens', draft.modalOpens || 0 );
		fd.append( 'download_pdf', draft.download_pdf || 0 );
		fd.append( 'download_png', draft.download_png || 0 );
		fd.append( 'download_json', draft.download_json || 0 );
		await fetch( window.stssbAdmin.ajaxUrl, { method: 'POST', body: fd, credentials: 'same-origin' } );
		setEditing( null );
		await load();
	};

	if ( null === rows ) {
		return <Spinner />;
	}

	return (
		<div className="stssb-stats">
			<table className="widefat striped">
				<thead>
					<tr>
						<th>{ __('Schema', 'stsalv-smart-schema-builder') }</th>
						<th>{ __('Modal opens', 'stsalv-smart-schema-builder') }</th>
						<th>{ __('PDF downloads', 'stsalv-smart-schema-builder') }</th>
						<th>{ __('PNG downloads', 'stsalv-smart-schema-builder') }</th>
						<th>{ __('JSON downloads', 'stsalv-smart-schema-builder') }</th>
						<th>{ __('First hit', 'stsalv-smart-schema-builder') }</th>
						<th>{ __('Last hit', 'stsalv-smart-schema-builder') }</th>
						<th>{ __('Actions', 'stsalv-smart-schema-builder') }</th>
					</tr>
				</thead>
				<tbody>
					{ 0 === rows.length && (
						<tr>
							<td colSpan={ 8 } className="stssb-stats__empty">
								{ __('No schemas yet.', 'stsalv-smart-schema-builder') }
							</td>
						</tr>
					) }
					{ rows.map( ( row ) => (
						<tr key={ row.id }>
							<td>
								<a href={ row.editUrl }><strong>{ row.title }</strong></a>
								<br />
								<span className="description">#{ row.id } · { row.status }</span>
							</td>
							<td>{ row.modalOpens }</td>
							<td>{ row.downloads.pdf }</td>
							<td>{ row.downloads.png }</td>
							<td>{ row.downloads.json }</td>
							<td>{ row.firstHit || '—' }</td>
							<td>{ row.lastHit || '—' }</td>
							<td>
								<Button
									variant="secondary"
									onClick={ () => {
										setEditing( row );
										setDraft( {
											modalOpens: row.modalOpens,
											download_pdf: row.downloads.pdf,
											download_png: row.downloads.png,
											download_json: row.downloads.json,
										} );
									} }
								>
									{ __('Edit', 'stsalv-smart-schema-builder') }
								</Button>
								<Button variant="tertiary" isDestructive onClick={ () => reset( row.id ) }>
									{ __('Reset', 'stsalv-smart-schema-builder') }
								</Button>
							</td>
						</tr>
					) ) }
				</tbody>
			</table>
			{ editing && (
				<Modal
					title={ __('Edit counters', 'stsalv-smart-schema-builder') + ' — ' + editing.title }
					onRequestClose={ () => setEditing( null ) }
				>
					<div className="stssb-stats-edit">
						<TextControl
							type="number"
							label={ __('Modal opens', 'stsalv-smart-schema-builder') }
							value={ draft.modalOpens || 0 }
							onChange={ ( next ) => setDraft( { ...draft, modalOpens: parseInt( next, 10 ) || 0 } ) }
						/>
						<TextControl
							type="number"
							label={ __('PDF downloads', 'stsalv-smart-schema-builder') }
							value={ draft.download_pdf || 0 }
							onChange={ ( next ) => setDraft( { ...draft, download_pdf: parseInt( next, 10 ) || 0 } ) }
						/>
						<TextControl
							type="number"
							label={ __('PNG downloads', 'stsalv-smart-schema-builder') }
							value={ draft.download_png || 0 }
							onChange={ ( next ) => setDraft( { ...draft, download_png: parseInt( next, 10 ) || 0 } ) }
						/>
						<TextControl
							type="number"
							label={ __('JSON downloads', 'stsalv-smart-schema-builder') }
							value={ draft.download_json || 0 }
							onChange={ ( next ) => setDraft( { ...draft, download_json: parseInt( next, 10 ) || 0 } ) }
						/>
						<div className="stssb-stats-edit__actions">
							<Button variant="primary" onClick={ saveEdit }>{ __('Save', 'stsalv-smart-schema-builder') }</Button>
							<Button variant="tertiary" onClick={ () => setEditing( null ) }>{ __('Cancel', 'stsalv-smart-schema-builder') }</Button>
						</div>
					</div>
				</Modal>
			) }
		</div>
	);
};

export default StatsPage;