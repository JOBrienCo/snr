/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * Deploy to Serial Number/Item record
 */
define(['N/record', 'N/search'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search) {
	function showReturnButton(SNitem,SNserial,SNcustomer) {
		//Return true or false if the return authorization button should be shown
		//Show button when item with specific serial number is not in inventory
		//AND no open return is entered
		//AND customer is entered on record
		if (!SNcustomer) {
			return false;
		}
		if (!SNserial.id) {
			//Not in system yet - Show button
			return true;
		}
		//Is in inventory?
		var inStock = false;
		var inventorynumberSearchObj = search.create({
			   type: "inventorynumber",
			   filters:
			   [
			      ["item","anyof",SNitem], 
			      "AND", 
			      ["inventorynumber","is",SNserial.text]
			   ],
			   columns:
			   [
				   search.createColumn({
				         name: "inventorynumber",
				         sort: search.Sort.ASC
				      }),
			      "item",
			      "memo",
			      "expirationdate",
			      "location",
			      "quantityonhand",
			      "quantityavailable",
			      "quantityonorder",
			      "isonhand",
			      "quantityintransit"
			   ]
			});
		var searchResultCount = inventorynumberSearchObj.runPaged().count;
		log.debug("inventorynumberSearchObj result count",searchResultCount);
		inventorynumberSearchObj.run().each(function(result){
		   // .run().each has a limit of 4,000 results
			inStock = result.getValue({name: 'isonhand'});
			log.debug("inStock",inStock);
			return true;
			});
		if (inStock) {
			return false;
		}
		var transactions = [];
		var transactionSearchObj = search.create({
			   type: "transaction",
			   filters:
			   [
				   ["inventorydetail.inventorynumber","anyof",SNserial.id],
				   "AND",
				   ["type","anyof","RtnAuth"],
				   "AND",
				   ["status","anyof","RtnAuth:A","RtnAuth:B","RtnAuth:D","RtnAuth:E"]
			   ],
			   columns:
			   [
			      "tranid",
			      "entity",
			      "account",
			      "memo",
			      "amount"
			   ]
			});
			var searchResultCount = transactionSearchObj.runPaged().count;
			log.debug("transactionSearchObj result count",searchResultCount);
			transactionSearchObj.run().each(function(result){
			   // .run().each has a limit of 4,000 results
				transactions.push(result);
			   return true;
			});
		if (transactions.length>0) {
			return false;
		}
		return true;
	}
	
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
    	if (scriptContext.type !== scriptContext.UserEventType.VIEW) {
    		return;
    	}
    	var SNform = scriptContext.form;
    	var SNrecord = scriptContext.newRecord;
    	var SNitem = SNrecord.getValue({
    		fieldId:	'custrecord_snr_item'
    	});
    	var SNserial = getSerialNumber(SNrecord); //Returns object {id: id,text: text}
    	var SNcustomer = SNrecord.getValue({
    		fieldId:	'custrecord_snr_customer'
    	});
    	log.debug({
			title: 'SNserial',
			details: JSON.stringify(SNserial)
		});
    	var showNewRAButton = showReturnButton(SNitem,SNserial,SNcustomer);
    	if (showNewRAButton) {
    		SNform.addButton({
    			id: 'custpage_new_ra',
    			label: 'Create Return Authorization',
    			functionName: 'createReturnButtonClick'
    		});
    	}
    	SNform.clientScriptModulePath = './SNR_create_records.js'
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

    }

    return {
        beforeLoad: beforeLoad,
        //beforeSubmit: beforeSubmit,
        //afterSubmit: afterSubmit
    };
    
});
