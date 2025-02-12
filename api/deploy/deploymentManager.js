'use strict';

const codeGen = require('../../util/codegen/v2');
const config = require('../../config/config.js');
const logger = global.logger;
const archiver = require('archiver');
const fileIO = require('../../util/codegen/lib/fileIO.js');
const deploymentUrlCreate = config.baseUrlDM + '/deployment';
const deploymentUrlUpdate = config.baseUrlDM + '/updateDeployment';
const deploymentApiChange = config.baseUrlDM + '/apiChange';
const fs = require('fs');
const request = require('request');

function __zip(_txnId, _path, _dest) {
	logger.debug(`[${_txnId}] Creating archive :: ${_dest}`);
	return new Promise((_resolve, _reject) => {
		let output = fs.createWriteStream(_dest);
		var archive = archiver('zip');
		output.on('close', () => _resolve('Done'));
		archive.on('error', (_err) => {
			logger.error(`[${_txnId}] Error creating archive :: ${_dest} :: ${_err.message}`);
			_reject(_err);
		});
		archive.pipe(output);
		archive.directory(_path, false);
		archive.finalize();
	});
}

var e = {};
e.deployService = (_txnId, _schema, _isUpdate, _oldData) => {
	const id = _schema._id;
	logger.info(`[${_txnId}] DM deploy :: ${id}`);
	var deploymentUrl;
	var envObj = {};
	return new Promise((resolve, reject) => {
		codeGen.generateFiles(_txnId, _schema)
			.then(() => {
				var envKeys = ['FQDN', 'GOOGLE_API_KEY', 'HOOK_CONNECTION_TIMEOUT', 'HOOK_RETRY', 'LOG_LEVEL', 'MODE', 'MONGO_APPCENTER_URL', 'MONGO_AUTHOR_DBNAME', 'MONGO_AUTHOR_URL', 'MONGO_LOGS_DBNAME', 'MONGO_LOGS_URL', 'MONGO_RECONN_TIME_MILLI', 'MONGO_RECONN_TRIES', 'MONGO_CONNECTION_POOL_SIZE', 'STREAMING_CHANNEL', 'STREAMING_HOST', 'STREAMING_PASS', 'STREAMING_RECONN_ATTEMPTS', 'STREAMING_RECONN_TIMEWAIT_MILLI', 'STREAMING_USER', 'DATA_STACK_NAMESPACE', 'CACHE_CLUSTER', 'CACHE_HOST', 'CACHE_PORT', 'RELEASE', 'TLS_REJECT_UNAUTHORIZED', 'API_REQUEST_TIMEOUT', 'TZ_DEFAULT', 'MAX_JSON_SIZE'];

				for (var i in envKeys) {
					var val = envKeys[i];
					envObj[val] = process.env[val];
				}

				envObj['DATA_STACK_APP_NS'] = (config.dataStackNS + '-' + _schema.app).toLowerCase();
				envObj['NODE_OPTIONS'] = `--max-old-space-size=${config.maxHeapSize}`;
				envObj['SERVICE_ID'] = `${_schema._id}`;
				envObj['SERVICE_PORT'] = `${_schema.port}`;
				_schema.api = (_schema.api).substring(1);
			})
			.then(() => {
				logger.debug(`[${_txnId}] DM deploy :: ${id} :: Generating zip file`);
				if (!fs.existsSync('./generatedServices/' + id)) {
					logger.error(`[${_txnId}] DM deploy :: ${id} :: ./generatedServices/${id} directory doesn't exist`);
					return new Error(`Missing directory :: ./generatedServices/${id}`);
				}
			})
			.then(() => __zip(_txnId, `./generatedServices/${id}`, `./generatedServices/${id}_${_schema.version}.zip`))
			.then(() => logger.debug(`[${_txnId}] DM deploy :: ${id} :: Zip file :: ./generatedServices/${id}_${_schema.version}.zip`))
			.then(() => {
				var formData = {
					deployment: JSON.stringify({
						image: id,
						imagePullPolicy: 'Always',
						namespace: config.dataStackNS + '-' + _schema.app,
						port: _schema.port,
						name: _schema.api,
						version: _schema.version,
						envVars: envObj,
						volumeMounts: {
							'file-export': {
								containerPath: '/app/output',
								hostPath: `${config.fsMount}/${id}`
							}
						},
						options: {
							livenessProbe: {
								httpGet: {
									path: '/' + _schema.app + '/' + _schema.api + '/utils/health/live',
									port: _schema.port,
									scheme: 'HTTP'
								},
								initialDelaySeconds: 5,
								timeoutSeconds: config.healthTimeout
							},
							readinessProbe: {
								httpGet: {
									path: '/' + _schema.app + '/' + _schema.api + '/utils/health/ready',
									port: _schema.port,
									scheme: 'HTTP'
								},
								initialDelaySeconds: 5,
								timeoutSeconds: config.healthTimeout
							}
						}
					}),
					oldDeployment: JSON.stringify(_oldData),
					file: fs.createReadStream(`./generatedServices/${id}_${_schema.version}.zip`),
				};
				logger.debug(`[${_txnId}] DM deploy :: ${id} :: Uploading to DM...`);
				if (_oldData) deploymentUrl = deploymentApiChange;
				else if (_isUpdate) deploymentUrl = deploymentUrlUpdate;
				else deploymentUrl = deploymentUrlCreate;
				logger.debug(`[${_txnId}] DM deploy :: ${id} :: URL :: ${deploymentUrl}`);
				return request.post({ url: deploymentUrl, formData: formData }, function (err, httpResponse, body) {
					if (err) {
						logger.error(`[${_txnId}] DM deploy :: ${id} :: Upload failed :: ${err.message}`);
						return reject(err);
					}
					if (httpResponse.statusCode >= 400) {
						let errorMsg = body && body.message ? body.message : 'DM returned statusCode ' + httpResponse.statusCode;
						logger.error(`[${_txnId}] DM deploy :: ${id} :: DM error :: ${errorMsg}`);
						return reject(new Error(errorMsg));
					}
					logger.info(`[${_txnId}] DM deploy :: ${id} :: Process queued in DM`);
					logger.debug(`[${_txnId}] DM deploy :: ${id} :: Upload to DM successful!`);
					logger.trace(`[${_txnId}] DM deploy :: ${id} :: DM response - ${JSON.stringify(body)}`);
					fileIO.deleteFolderRecursive('./generatedServices/' + id);
					fileIO.removeFile('./generatedServices/' + id + '_1.zip');
					resolve('Process queued in DM');
				});
			})
			.catch(e => {
				logger.error(`[${_txnId}] DM deploy :: ${id} :: ${e.message}`);
				reject(e);
			});
	});
};

module.exports = e;