/**
 * Admin AJAX wrapper with base64-safe JSON transport.
 *
 * @package StSalvSmartSchemaBuilder
 * @since   1.0.0
 */

const ajaxUrl = () => window.stssbAdmin?.ajaxUrl || '/wp-admin/admin-ajax.php';
const nonce = () => window.stssbAdmin?.adminNonce || '';

/**
 * Encode a JSON-serializable value to base64 (UTF-8 safe).
 *
 * @since 1.0.0
 * @param {*} value Value to encode.
 * @return {string} Base64 string.
 */
const encodeJsonBase64 = ( value ) => {
	const json = JSON.stringify( value );
	const bytes = new TextEncoder().encode( json );
	let binary = '';
	bytes.forEach( ( byte ) => {
		binary += String.fromCharCode( byte );
	} );
	return btoa( binary );
};

/**
 * Perform an admin-ajax request.
 *
 * @since 1.0.0
 * @param {string} action AJAX action name.
 * @param {string} method HTTP method: GET or POST.
 * @param {Object} data   Request payload.
 * @return {Promise<Object>} Response data.
 */
async function call( action, method = 'GET', data = null ) {
	const params = new URLSearchParams();
	params.append( 'action', action );
	params.append( 'nonce', nonce() );

	const options = { method, credentials: 'same-origin' };

	if ( 'GET' === method && data ) {
		Object.entries( data ).forEach( ( [ key, value ] ) => {
			params.append( key, value );
		} );
	}

	if ( 'POST' === method ) {
		const formData = new FormData();
		formData.append( 'action', action );
		formData.append( 'nonce', nonce() );
		if ( data ) {
			Object.entries( data ).forEach( ( [ key, value ] ) => {
				formData.append(
					key,
					'object' === typeof value ? encodeJsonBase64( value ) : String( value )
				);
			} );
		}
		options.body = formData;
	}

	const response = await fetch( `${ ajaxUrl() }?${ params.toString() }`, options );
	if ( ! response.ok ) {
		throw new Error( `HTTP ${ response.status }` );
	}

	const json = await response.json();
	if ( ! json || false === json.success ) {
		throw new Error( json?.data?.message || 'Request failed' );
	}
	return json.data;
}

export const listSchemas = () => call( 'stssb_list_schemas' );
export const getSchema = ( id ) => call( 'stssb_get_schema', 'GET', { id } );
export const saveSchema = ( payload ) => call( 'stssb_save_schema', 'POST', payload );
export const deleteSchema = ( id ) => call( 'stssb_delete_schema', 'POST', { id } );
export const exportSchema = ( id ) => call( 'stssb_export_schema', 'GET', { id } );
export const importSchema = ( id, importData ) =>
	call( 'stssb_import_schema', 'POST', { id, import: importData } );