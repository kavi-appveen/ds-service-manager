let e = {};
const globalDefHelper = require('../helpers/util/globalDefinitionHelper.js');
const envConfig = require('../../config/config.js');
const dm = require('../deploy/deploymentManager');
const fileIO = require('../../util/codegen/lib/fileIO.js');
const mongoose = require('mongoose');
const request = require('request');
const _ = require('lodash');
const logger = global.logger;

// to check
// commented as attributeList is not required anymore
// e.getAttributeList = function (_definitions, parentKey, parentLabel) {
// 	let _temp = [];
// 	for (let i in _definitions) {
// 		let _def = _definitions[i];
// 		let key = (parentKey ? parentKey + `.` : ``) + i;
// 		let name = (parentLabel ? parentLabel + `.` : ``) + _def.properties.name;
// 		let properties = JSON.parse(JSON.stringify(_def.properties));
// 		if (_def.type == `Object`) {
// 			_temp = _temp.concat(e.getAttributeList(_def.definition, key, name));
// 		} else if (_def.type == `Array`) {
// 			//do nothing
// 		}
// 		else {
// 			_temp.push({
// 				key: key,
// 				name: name,
// 				properties
// 			});
// 		}
// 	}
// 	return _temp;
// };

e.postRolesUserMgmt = function (data, _req) {
	let txnId = _req.get('TxnId') || _req.headers.txnId;
	let id = data._id;
	var options = {
		url: envConfig.baseUrlUSR + '/role',
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'TxnId': _req.get('txnId'),
			'Authorization': _req.get('Authorization'),
			'User': _req.get('user')
		},
		json: true,
		body: data
	};
	return new Promise((resolve, reject) => {
		request.post(options, function (err, res) {
			if (err) {
				logger.error(`[${txnId}] Creating roles in UserMgmt :: ${id} :: ${err.message}`);
				reject(err);
			} else if (!res) {
				logger.error(`[${txnId}] Creating roles in UserMgmt :: ${id} :: User Management down.`);
				reject(new Error('User Management Service DOWN'));
			}
			else {
				if (res.statusCode >= 200 && res.statusCode < 400) {
					logger.info(`[${txnId}] Creating roles in UserMgmt :: ${id} :: Role Added`);
					resolve();
				} else {
					let message = res.body && res.body.message ? 'Roles creation failed:: ' + res.body.message : 'Roles creation failed';
					logger.error(`[${txnId}] Creating roles in UserMgmt :: ${id} :: ${message}`);
					reject(new Error(message));
				}
			}
		});
	});
};

e.updateRolesUserMgmt = function (serviceId, data, _req) {
	let txnId = _req.get('TxnId') || _req.headers.txnId;
	let id = serviceId;
	var options = {
		url: envConfig.baseUrlUSR + '/role/' + serviceId,
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			'TxnId': _req.get('txnId'),
			'Authorization': _req.get('Authorization'),
			'User': _req.get('user')
		},
		json: true,
		body: data
	};
	return new Promise((resolve, reject) => {
		request.put(options, function (err, res) {
			if (err) {
				logger.error(`[${txnId}] Updating roles in UserMgmt :: ${id} :: ${err.message}`);
				reject(err);
			} else if (!res) {
				logger.error(`[${txnId}] Updating roles in UserMgmt :: ${id} :: User Management down.`);
				reject(new Error('User Management Service DOWN'));
			}
			else {
				if (res.statusCode >= 200 && res.statusCode < 400) {
					logger.info(`[${txnId}] Updating roles in UserMgmt :: ${id} :: Role Added`);
					resolve();
				} else {
					let message = res.body && res.body.message ? 'Roles updation failed :: ' + res.body.message : 'Roles updation failed';
					logger.error(`[${txnId}] Updating roles in UserMgmt :: ${id} :: ${message}`);
					reject(new Error(message));
				}
			}
		});
	});
};

e.deleteServiceInUserMgmt = function (_id, _req) {
	let txnId = _req.get('TxnId');
	var options = {
		url: envConfig.baseUrlUSR + '/service/' + _id,
		method: 'Delete',
		headers: {
			'Content-Type': 'application/json',
			'TxnId': _req.get('TxnId'),
			'Authorization': _req.get('Authorization'),
			'User': _req.get('user')
		},
		json: true
	};
	request.delete(options, function (err, res) {
		if (err) logger.error(`[${txnId}] Delete service in UserMgmt :: ${_id} :: ${err.message}`);
		else if (!res) logger.error(`[${txnId}] Delete service in UserMgmt :: ${_id} :: User Management service DOWN`);
		else logger.info(`[${txnId}] Delete service in UserMgmt :: ${_id} :: Service deletion process queued.`);
	});
};

e.createServiceInUserMgmt = function (_id, _req, body) {
	let txnId = _req.get('TxnId');
	var options = {
		url: envConfig.baseUrlUSR + '/service/' + _id,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'TxnId': _req.get('txnId'),
			'Authorization': _req.get('Authorization'),
			'User': _req.get('user')
		},
		json: true,
		body: body
	};
	request.post(options, function (err, res) {
		if (err) logger.error(`[${txnId}] Create service in UserMgmt :: ${_id} :: ${err.message}`);
		else if (!res) logger.error(`[${txnId}] Create service in UserMgmt :: ${_id} :: User Management service DOWN`);
		else logger.info(`[${txnId}] Create service in UserMgmt :: ${_id} :: Service creation process queued.`);
	});
};

e.deleteServiceInWorkflow = function (_id, _req) {
	let txnId = _req.get('TxnId');
	var options = {
		url: envConfig.baseUrlWF + '/service/' + _id,
		method: 'Delete',
		headers: {
			'Content-Type': 'application/json',
			'TxnId': _req.get('txnId'),
			'Authorization': _req.get('Authorization'),
			'User': _req.get('user')
		},
		json: true
	};
	request.delete(options, function (err, res) {
		if (err) logger.error(`[${txnId}] Delete service in Workflow :: ${_id} :: ${err.message}`);
		else if (!res) logger.error(`[${txnId}] Delete service in Workflow :: ${_id} :: Workflow service DOWN`);
		else logger.info(`[${txnId}] Delete service in Workflow :: ${_id} :: Service deletion process queued.`);
	});
};

e.sendToSocket = function (_socket, _channel, _body) {
	_socket.emit(_channel, _body);
};

e.getSystemFields = (list, key, definition, systemFields) => {
	if (definition[0] && definition[0].key == '_self') {
		if (definition[0]['type'] === 'Object') {
			e.getSystemFields(list, key, definition[0]['definition'], systemFields);
		} else if (systemFields.indexOf(definition[0]['type']) > -1) {
			list[definition[0]['type']].push(key);
		}
	} else {
		definition.forEach(def => {
			let _k = def.key;
			let _key = key === '' ? _k : key + '.' + _k;
			if (def['type'] === 'Array' || def['type'] === 'Object') {
				e.getSystemFields(list, _key, def['definition'], systemFields);
			} else if (systemFields.indexOf(def['type']) > -1) {
				list[def['type']].push(_key);
			}
		});
	}
};

e.updateDocument = (model, query, updateObj, req) => {
	return model.findOne(query)
		.then(doc => {
			if (doc) {
				let newDoc = Object.assign({}, doc.toObject(), updateObj);
				if (_.isEqual(newDoc, doc.toObject()))
					return doc;
				else {
					return Object.assign(doc, updateObj).save(req);
				}
			}
		});
};

e.deployService = (_schemaDetails, socket, req, _isUpdate, _isDeleteAndCreate) => {
	let id = _schemaDetails._id;
	let txnId = req.get('TxnId') || req.headers.txnId;
	logger.info(`[${txnId}] Deploy service :: ${id}`);
	let systemFields = {
		'File': [],
		'Geojson': []
	};
	e.getSystemFields(systemFields, '', _schemaDetails.definition, ['File', 'Geojson']);
	_schemaDetails.geoJSONFields = systemFields.Geojson;
	_schemaDetails.fileFields = systemFields.File;
	return globalDefHelper.expandSchemaWithGlobalDef(_schemaDetails.app, _schemaDetails.definition)
		.then(def => {
			logger.trace(`[${txnId}] Deploy service :: ${id} :: Updated definition :: ${JSON.stringify(def)}`);
			logger.trace(`[${txnId}] Deploy service :: ${id} :: Schema details obj :: ${JSON.stringify(_schemaDetails)}`);
			_schemaDetails.definition = def;
			_schemaDetails.definition = globalDefHelper.expandSchemaWithSystemGlobalDef(_schemaDetails.definition);
			return e.updateDocument(mongoose.model('services'), { _id: id }, { status: 'Pending' }, req);
		})
		.then((_d) => {
			logger.debug(`[${txnId}] Deploy service :: ${id} :: Service moved to pending status`);
			logger.trace(`[${txnId}] Deploy service :: ${id} :: ${JSON.stringify(_d)}`);
			return dm.deployService(txnId, _schemaDetails, _isUpdate, _isDeleteAndCreate);
		})
		.catch(e => {
			logger.error(`[${txnId}] Deploy service :: ${id} :: Deployment failed :: ${e}`);
			// cleanup should happen where the code is generated
			// TODO: Jerry/Shobhit
			var startPromise = new Promise.resolve();
			startPromise.then(() => {
				fileIO.deleteFolderRecursive('./generatedServices/' + id);
			})
				.then(() => {
					if (socket) {
						e.sendToSocket(socket, 'serviceStatus', {
							_id: id,
							message: 'Undeployed',
							app: _schemaDetails.app
						});
					}
				})
				.then(() => {
					return e.updateDocument(mongoose.model('services'), {
						_id: id
					}, {
						status: 'Errored',
						comment: e.message
					}, req);
				})
				.catch(err => logger.error(`[${txnId}] Deploy service :: ${id} :: ${err.message}`));
			logger.error(`[${txnId}] Deploy service :: ${id} :: ${e.message}`);
		});
};

e.updateInPM = function (id, req) {
	var options = {
		url: envConfig.baseUrlPM + '/dataservice/' + id,
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			'TxnId': req ? req.get('txnId') : null,
			'Authorization': req ? req.get('Authorization') : null,
			'User': req ? req.get('user') : null
		},
		json: true
	};
	return new Promise((resolve, reject) => {
		request(options, function (err, res) {
			if (err) {
				logger.error(err.message);
				reject(err);
			} else if (!res) {
				logger.error('PM Service DOWN');
				reject(new Error('PM Service DOWN'));
			}
			else {
				if (res.statusCode >= 200 && res.statusCode < 400) {
					resolve();
					logger.info('DS updated in PM');
				} else {
					reject(new Error(res.body && res.body.message ? 'API failed:: ' + res.body.message : 'API failed'));
				}
			}
		});
	});
};

e.updatePMForCalendar = function (req, body) {
	var options = {
		url: envConfig.baseUrlPM + '/flow/update/timebound',
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			'TxnId': req ? req.get('txnId') : null,
			'Authorization': req ? req.get('Authorization') : null,
			'User': req ? req.get('user') : null
		},
		json: body
	};
	return new Promise((resolve, reject) => {
		request(options, function (err, res) {
			if (err) {
				logger.error(err.message);
				reject(err);
			} else if (!res) {
				logger.error('PM Service DOWN');
				reject(new Error('PM Service DOWN'));
			}
			else {
				if (res.statusCode >= 200 && res.statusCode < 400) {
					resolve();
					logger.info('Calendar updated in PM');
				} else {
					reject(new Error(res.body && res.body.message ? 'API failed:: ' + res.body.message : 'API failed'));
				}
			}
		});
	});
};
module.exports = e;
