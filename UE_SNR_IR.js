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
		var itemRectRec = scriptContext.newRecord;
		var recId = itemRectRec.id;
		log.debug({
			title: 'recId',
			details: recId
		});
		//Loop thru line items on Item Receipt
		var numLines = itemRectRec.getLineCount('item');
		log.debug({
			title: 'numLines',
			details: numLines
		});
		for (var i=0; i<numLines; i++) {
			var invDetail = itemRectRec.getSublistValue({
				sublistId:	'item',
				fieldId:	'inventorydetail',
				line:		i
			});
			log.debug({
				title: 'invDetail',
				details: invDetail
			});
			var itemId = itemRectRec.getSublistValue({
				sublistId:	'item',
				fieldId:	'item',
				line:		i
			});
			var itemName = itemRectRec.getSublistText({
				sublistId:	'item',
				fieldId:	'itemname',
				line:		i
			});
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
				//Create S/N record(s)
				for (var j=0; j<serialNumbers.length; j++){
					var SNrec = record.create({
						type: 'customrecord_snr'
					});
					SNrec.setValue('custrecord_snr_sn',serialNumbers[j]);
					SNrec.setValue('custrecord_snr_item',itemId);
					SNrec.setValue('custrecord_snr_item_receipt',recId);
					SNrec.setValue('name',serialNumbers[j] + '-' + itemName);
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

});
