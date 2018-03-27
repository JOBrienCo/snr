/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/search'],
		/**
		 * @param {record} record
		 */
		function(record,search) {

	/**
	 * Function definition to be triggered before record is loaded.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.newRecord - New record
	 * @param {string} scriptContext.type - Trigger type
	 * @param {Form} scriptContext.form - Current form
	 * @Since 2015.2
	 */
	function beforeLoad(scriptContext) {

	}

	/**
	 * Function definition to be triggered before record is loaded.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.newRecord - New record
	 * @param {Record} scriptContext.oldRecord - Old record
	 * @param {string} scriptContext.type - Trigger type
	 * @Since 2015.2
	 */
	function beforeSubmit(scriptContext) {

	}

	/**
	 * Function definition to be triggered before record is loaded.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.newRecord - New record
	 * @param {Record} scriptContext.oldRecord - Old record
	 * @param {string} scriptContext.type - Trigger type
	 * @Since 2015.2
	 */
	function afterSubmit(scriptContext) {
		var newRecord = scriptContext.newRecord;
		var recType = newRecord.type;
		var recId = newRecord.id;
		log.debug({
			title: 'recId, recType',
			details: recId + ', ' + recType
		});
		//Loop thru line items on Item Receipt
		var numLines = newRecord.getLineCount('item');
		log.debug({
			title: 'numLines',
			details: numLines
		});
		for (var i=0; i<numLines; i++) {
			var invDetail = newRecord.getSublistValue({
				sublistId:	'item',
				fieldId:	'inventorydetail',
				line:		i
			});
			log.debug({
				title: 'invDetail',
				details: invDetail
			});
			var itemId = newRecord.getSublistValue({
				sublistId:	'item',
				fieldId:	'item',
				line:		i
			});
			var itemName = newRecord.getSublistText({
				sublistId:	'item',
				fieldId:	'itemname',
				line:		i
			});
			if (recType == record.Type.INVOICE || recType == record.Type.RETURN_AUTHORIZATION) {
				//Invoice record does not have item name as a field
				//Look up item name
				itemName = getItemName(itemId);
			}
			if (itemName == undefined) {
				throw "Item name cannot be found for itemId: " + itemId;
			}
			if (invDetail) {
				//Get invDetail
				var serialNumbers = [];
				var inventorydetailSearchObj = search.create({
					type: "inventorydetail",
					filters: [
						["internalid","anyof","12102"]
						],
						columns: [
							search.createColumn({
								name: "inventorynumber",
								sort: search.Sort.ASC
							}),
							"binnumber",
							"quantity",
							"itemcount",
							search.createColumn({
								name: "inventorynumber",
								join: "inventoryNumber"
							})
							]
				});
				var searchResultCount = inventorydetailSearchObj.runPaged().count;
				inventorydetailSearchObj.run().each(function(result){
					// .run().each has a limit of 4,000 results
					serialNumbers.push(
							result.getValue({
								name: 'inventorynumber',
								join: 'inventoryNumber'
							})
					);
					return true;
				});
				log.debug({
					title: 'serialNumbers',
					details: JSON.stringify(serialNumbers)
				});
				
				for (var j=0; j<serialNumbers.length; j++){
					var recName = serialNumbers[j] + '-' + itemName;
					//Find Serial Number Record
					var SNrec;
					var arrSNid = getSNRec(recName);
					if (arrSNid.length == 0) {
						//Create SN record
						SNrec = record.create({
							type: 'customrecord_snr'
						});
						SNrec.setValue('custrecord_snr_sn',serialNumbers[j]);
						SNrec.setValue('custrecord_snr_item',itemId);
						SNrec.setValue('name',recName);
					}
					else if (arrSNid.length > 1) {
						//Multiple SN records found!  Error out
						throw "Multiple SN records found! " + arrSNid.toString();
					}
					else {
						SNrec = record.load({
							type: 'customrecord_snr',
							id: arrSNid[0]
						});
					}
					switch (recType) {
						case record.Type.ITEM_RECEIPT :
							log.debug({
								title: 'record.Type.ITEM_RECEIPT',
								details: recId + ', ' + recType + ', ' + arrSNid[0]
							});
							SNrec.setValue('custrecord_snr_item_receipt',recId);
							break;
						case record.Type.ITEM_FULFILLMENT :
							log.debug({
								title: 'record.Type.ITEM_FULFILLMENT',
								details: recId + ', ' + recType + ', ' + arrSNid[0]
							});
							SNrec.setValue('custrecord_snr_item_fulfillment',recId);
							SNrec.setValue('custrecord_snr_customer',newRecord.getValue('entity'));
							break;
						case record.Type.INVOICE :	//Same as Web Sale
							log.debug({
								title: 'record.Type.INVOICE',
								details: recId + ', ' + recType + ', ' + arrSNid[0]
							});
						case record.Type.CASH_SALE :
							log.debug({
								title: 'record.Type.CASH_SALE',
								details: recId + ', ' + recType + ', ' + arrSNid[0]
							});
							SNrec.setValue('custrecord_snr_invoice',recId);
							break;
						case record.Type.RETURN_AUTHORIZATION :
							log.debug({
								title: 'record.Type.RETURN_AUTHORIZATION',
								details: recId + ', ' + recType + ', ' + arrSNid[0]
							});
							SNrec.setValue('custrecord_snr_return_auth',recId);
							break;
						default:
							throw "No matching record type to " + recType + ', ' + arrSNid[0];
					}
					SNrec.save();
				}
			}
		}
	}

	return {
		//beforeLoad: beforeLoad,
		//beforeSubmit: beforeSubmit,
		afterSubmit: afterSubmit
	};

	function getSNRec(recName) {
		var results = [];
		var SNsearch = search.create({
			type: 'customrecord_snr',
			filters: search.createFilter({
				name: 'name',
				operator: 'IS',
				values: recName
			}),
			columns: 'name'
		});
		SNsearch.run().each(function(result) {
			results.push(result.id);
			return true;
		});
		return results;
	}
	
	function getItemName(itemId) {
		var itemNameLookup = search.lookupFields({
			type: 'item',
			id:		itemId,
			columns:	['itemId']
		});
		log.debug({
			title: 'itemNameLookup',
			details: JSON.stringify(itemNameLookup)
		});
		return itemNameLookup.itemId;
	}
});
