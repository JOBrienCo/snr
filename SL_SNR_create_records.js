/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search'],
/**
 * @param {record} record
 */
function(record, search) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function createReturn(context) {
    	log.debug({
			title: 'DEBUG',
			details: 'createRA' 
		});
		var parameters = context.request.parameters;
		log.debug({
			title:	'parameters',
			details:	JSON.stringify(parameters)
		});
		var SNitem = parameters.SNitem;
		var recRA = record.create({
			type :    record.Type.RETURN_AUTHORIZATION,
			isDynamic :        true
		});
		recRA.setValue({
			fieldId:    'entity',
			value:        parameters.SNcustomer
		});
		recRA.setValue({
			fieldId:    'department',
			value:        3
		});
		recRA.setValue({
			fieldId:    'location',
			value:        2
		});
		recRA.setValue({
			fieldId:	'custbody_order_rep',
			value:		parameters.user
		});
		log.debug({
			title: 'DEBUG',
			details: 'memo:test' 
		});
		recRA.setValue({
			fieldId:    'memo',
			value:        'test:made via script'
		});
		recRA.selectNewLine({
			sublistId:    'item'
		});
		recRA.setCurrentSublistValue({
			sublistId : 'item',
			fieldId :    'item',
			value:    parameters.SNitem
		});
		recRA.setCurrentSublistValue({
			sublistId : 'item',
			fieldId :    'quantity',
			value:    1
		});
		recRA.setCurrentSublistValue({
			sublistId:    'item',
			fieldId:    'price',
			value:        -1
		});
		recRA.setCurrentSublistValue({
			sublistId:    'item',
			fieldId:    'rate',
			value:        0
		});
		var subrecordInvDetail = recRA.getCurrentSublistSubrecord({
			sublistId:    'item',
			fieldId:    'inventorydetail'
		});
		subrecordInvDetail.selectNewLine({
			sublistId:    'inventoryassignment'
		});
		subrecordInvDetail.setCurrentSublistValue({
			sublistId:    'inventoryassignment',
			fieldId:    'receiptinventorynumber',
			value:        parameters.SNserial
		});
		subrecordInvDetail.commitLine({
			sublistId:    'inventoryassignment'
		});
		log.debug({
			title: 'DEBUG',
			details: 'commit:LINEITEM' 
		});
		recRA.commitLine({
			sublistId:    'item'
		});
		var recRAId = recRA.save();

		log.debug({
			title: 'DEBUG',
			details: recRAId 
		});
		
		if (!parameters.SNserialId) {
			//Load SNR record if serial ID does not exist (new)
			recSNR = record.load({
				type:	parameters.SNRType,
				id:		parameters.SNR
			});
			recNewRA = record.load({
				type:	record.Type.RETURN_AUTHORIZATION,
				id:		recRAId
			});
			var serialId = getSerialId(recNewRA);
			recSNR.setValue({
				fieldId:	'custrecord_snr_sn',
				value:		serialId
			});
			var recSNRId = recSNR.save();
			log.debug({
				title: 'recSNRid',
				details: recSNRId
			});
		}
		
    }
    return {
    	onRequest: createReturn
    };
    
    function getSerialId(record) {
    	//Grab serial number from first line item of record
    	var itemId = record.getSublistValue({
    		sublistId:		'item',
    		fieldId:		'item',
    		line:			0
    	});
    	log.debug({
    		title: 'itemId',
    		details: itemId
    	});
    	var inventoryDetailSubrecord = record.getSublistSubrecord({
    		sublistId:	'item',
    		fieldId:	'inventorydetail',
    		line:		0
    	});
    	var inventoryNumber = inventoryDetailSubrecord.getSublistValue({
    		sublistId:	'inventoryassignment',
    		fieldId:	'receiptinventorynumber',	//This returns the actual serial number
    		//fieldId:	'inventorydetail',			//This returns the internal ID of the S/N
    		line:		0
    	});	
    	log.debug({
    		title: 'inventoryNumber',
    		details: inventoryNumber
    	});
    	var inventoryNumberInternalId = getInventoryNumberInternalId(inventoryNumber,itemId)
    	return inventoryNumberInternalId;
    }
    
    function getInventoryNumberInternalId(inventoryNumber,itemId) {
    	var inventoryNumberSearchObj = search.create({
    		type:		'inventorynumber',
    		filters:	
    			[
    			      ["inventorynumber","is",inventoryNumber], 
    			      "AND", 
    			      ["item","anyof",itemId]
    			   ],
    			   columns:
    			   [
    			      "internalid"
    			   ]
    	});
    	inventoryNumberSearchObj.run().each(function(result){
    		inventoryNumberId = result.getValue({name: 'internalid'});
    		return true;
    	});
    	log.debug({
    		title: 'inventoryNumberId',
    		details: inventoryNumberId
    	});
    	return inventoryNumberId;
    }
});


