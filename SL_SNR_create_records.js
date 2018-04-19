/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record'],
/**
 * @param {record} record
 */
function(record) {
   
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
    }

    return {
    	onRequest: createReturn
    };
    
});
