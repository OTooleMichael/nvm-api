const { getData ,getBearerToken} = require('./core');
const Report = require('./Report');

function NVM(config){
	let sample = {
		ACCOUNT_KEY:"string",
		CLIENT_SECRET:"string",
		CLOUD:"string"
	};
	for(var el in sample)
	{
		if(typeof config[el] !== sample[el])
		{
			throw new Error(el+' IS a required param');
		};
	}
	this.throttling = config.throttling || 400;
	this.lastCall;
	this.config = Object.assign({},config);
	this.failedLogins = [];
	this.access_token = null;
	this._auth = this._auth.bind(this)
	return this
};

NVM.prototype._auth = function() {
	if(this.failedLogins.length > 2){
		return Promise.reject({error:"LOGIN_FAILURE",errors:this.failedLogins});
	}
	return getBearerToken({
		ACCOUNT_KEY:this.config.ACCOUNT_KEY,
		CLIENT_SECRET:this.config.CLIENT_SECRET,
		CLOUD:this.config.CLOUD
	}).then((access_token)=>
	{
		this.access_token = access_token;
		this.failedLogins = [];
		return Promise.resolve();
	})
	.catch((error)=>{
		this.failedLogins.push(error);
		return wait(500).then(()=>this._auth());
	});
};
NVM.prototype.getData = function(params) {
	params = Object.assign({},params);
	params.CLOUD =  this.config.CLOUD;
	params.ACCOUNT_KEY = this.config.ACCOUNT_KEY;
	let Q = Promise.resolve().then(()=>{
		if(!this.access_token)
		{
			return this._auth();
		}
		return Promise.resolve();
	})
	.then(()=>
	{
		params.token = this.access_token;  // apply token when toek is there only
		if(this.lastCall && (Date.now() - this.lastCall) < this.throttling){
			return wait(this.throttling).then(()=>getData(params));
		}else{
			this.lastCall = Date.now();
			return getData(params);
		}
	})
	.catch((err)=>{
		if(err.error == 'ACCESS_DENIED')
		{
			this.access_token = null;
			return this.getData(params);
		}
		throw err
	})
	return Q
};
function wait(time){
	return new Promise(function(resolve){
		setTimeout(resolve,time)
	});
}
NVM.prototype.report = function(params) {
	return new Report(params,this)
};
NVM.prototype.inboundReport = function(params) {
	params.report = 'INBOUND';
	return new Report(params,this)
};
NVM.prototype.outboundReport = function(params) {
	params.report = 'OUTBOUND';
	return new Report(params,this)
};
NVM.prototype.agentsReport = function(params) {
	params.report = 'AGENTS';
	return new Report(params,this)
};
module.exports = NVM

