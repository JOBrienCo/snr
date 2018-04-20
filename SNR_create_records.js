define(['N/record', 'N/transaction', 'N/ui', 'N/ui/dialog', 'N/ui/message', 'N/url', 'N/runtime', 'N/https'],
/**
 * @param {record} record
 * @param {transaction} transaction
 * @param {ui} ui
 * @param {dialog} dialog
 * @param {message} message
 * @param {serverWidget} serverWidget
 * @param {url} url
 */
function(record, transaction, ui, dialog, message, purl, runtime, https) {
	function getSerialNumber(SNrecord) {
		var serialNumber = {};
		serialNumber.id = SNrecord.getValue({
			fieldId:	'custrecord_snr_sn'
		});
		serialNumber.text = SNrecord.getText({
			fieldId:	'custrecord_snr_sn_freeform'
		});
		
		return serialNumber;
	}
	function createReturnButtonClick() {
		var url = new URL(window.location.href);
		var redirectURL = url.origin;
		var recordId = url.searchParams.get("id");
		var recordType = url.searchParams.get("rectype");	//returns a type ID - not useful
		log.debug({
			title: 'SNR_create_records file',
			details: 'id: ' + recordId + ' type: ' + recordType
		});
		var currentRecord = record.load({
			type: 'customrecord_snr',
			id: recordId
		});
		var SNitem = currentRecord.getValue({
			fieldId:	'custrecord_snr_item'
		});
		var SNitemName = currentRecord.getText({
			fieldId:	'custrecord_snr_item'
		});
		var SNserial = getSerialNumber(currentRecord);
		var SNcust = currentRecord.getValue({
			fieldId:	'custrecord_snr_customer'
		});
		var parameters = {};
		parameters.SNitem = SNitem;
		parameters.user = runtime.getCurrentUser().id;
		parameters.SNserial = SNserial.text;
		parameters.SNserialId = SNserial.id;
		parameters.SNcustomer = SNcust;
		parameters.SNR = recordId;
		parameters.SNRType = 'customrecord_snr';
		
		console.log('Create records ' + SNitem + ' ' + JSON.stringify(SNserial) + ' ' + SNcust);
		var output = purl.resolveScript({
			scriptId: 'customscript_sl_snr_create_records',
			deploymentId: 'customdeploy1',
			returnExternalUrl: true
		});

		var response = https.post({
			url:	output,
			body:	parameters
		});
		log.debug({
			title: 'Debug',
			details: response
		});
		console.log(JSON.parse(response.body));
		response = JSON.parse(response.body);
		if (response.identifier == 'returnauthorization') {
			redirectURL += '/app/accounting/transactions/rtnauth.nl?id=' + response.id;
			window.open(redirectURL);
		}
   }
    return {
        createReturnButtonClick : 	createReturnButtonClick
    };
    
});
