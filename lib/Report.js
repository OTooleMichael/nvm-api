const moment = require('moment');
moment.suppressDeprecationWarnings = true;
const { validDates , datesToDateList ,myError } = require('./tools');
const { Readable } = require('stream');
const util = require('util');
function Report(params,client)
{
	Readable.call(this,{
		objectMode:true
	});
	let reports = {
		INBOUND:'inboundcalls',
		OUTBOUND:'outboundcalls',
		AGENTS:'agentstates'
	};

	this.rows = [];
	this._started = false;
	this.results = {
		rows:this.rows,
		count:0,
		calls:0,
		start:null,
		end:null,
		runTime:null
	};
	this.endpoint = reports[params.report];
	if(!this.endpoint){
		throw myError({error:"INVALID REPORT TYPE",message:params })
	}
	this.params = Object.assign({},params);
	let valid = validDates(this.params);
	if(!valid){
		throw myError({error:'INVALID_DATES',message:"unknown error"});
	};
	this.pages = datesToDateList(this.params);
	this.client = client;
	this._isReadable = false;
	this._isCompleted = false;
	this._rows = [];
	return this
}
Report.prototype._read = function(){
	this._isReadable = true;
	this.emit('_resume');
	this._distibute();
}
Report.prototype._distibute = function()
{
	if(!this._isReadable) return;
	let _isReadable = false;
	if(this._rows.length) _isReadable = this.push(this._rows.shift())
	while(this._rows.length && _isReadable){
		// nothign here
		_isReadable = this.push(this._rows.shift())
	}
	this._isReadable = (this._rows.length == 0 );
	if(this._isReadable){
		this.emit('_resume');
		if(this._isCompleted){
	    	return this.push(null);
	    }
	}
	
}
Report.prototype.getDataParams = function(p){
	p.endpoint = this.endpoint;
	if(this.endpoint == 'outboundcalls' || this.endpoint == 'inboundcalls'){
		p.additionalfield = 'uniqueid'
	};
	return p;
}
Report.prototype.limit = function(int){
	this._limit = int;
	return this
}
Report.prototype.run = function(cb) {
	if(this._started) return;
	this._started = true;
	this.results.start = new Date();
	let Q = this.pages.reduce((previous,page)=>{
		page = this.getDataParams(page);
		return previous.then(()=>{ 
			if(this._limit && this._limit <= this.results.count ){
				return Promise.resolve([]);
			}
			return this.client.getData(page)  
		})
		.then((rows)=>{
			if(!rows.length) return Promise.resolve();
			this.results.count += rows.length;
			this.results.calls ++;
			this.rows = this.rows.concat(rows);
			return Promise.resolve();
		})
	},Promise.resolve())
	.then(()=>{
		this.results.end = new Date();
		this.results.runTime = this.results.end - this.results.start
		let rows = (this._limit) ? this.rows.slice(0,this._limit) : this.rows
		this.results.rows = rows;
		return Promise.resolve(this.results);
	})
	if(typeof cb == "function")
	{
		Q = Q.then((results)=>cb(null,results)).catch(cb);
		return 
	}
	else
	{
		return Q
	}
};
Report.prototype.then = function(fn){
	return this.run(undefined).then(fn)
}
Report.prototype.stream  = function(){
	if(this._started) return;
	this._started = true;
	this.results.start = new Date();
	let Q = this.pages.reduce((previous, page)=>{
	    page = this.getDataParams(page);
		return previous.then(()=> {
			if(this._limit && this._limit <= this.results.count ){
				return Promise.resolve([]);
			}
			if(this._isReadable){
				return this.client.getData(page);
			}
			return new Promise((resolve)=>{
				let fn = ()=>{
					this.removeListener('_resume',fn);
					return resolve();
				};
				this.on('_resume',fn);
			}).then(()=>this.client.getData(page))
		})
		.then((rows)=>{
			let toLimit = this._limit - this.results.count - rows.length;
			if(this._limit && toLimit <= 0){
				rows = rows.splice(0,this._limit - this.results.count)
			}
			if(!rows.length) return Promise.resolve();
			this.results.count += rows.length;
			this.results.calls ++;
			this._rows = this._rows.concat(rows);
			this._distibute();
			this.emit('progress',{
				type:"PAGE",
				timeRange:page,
				call:this.results.calls,
				rowsReturned:rows.length
			});
			return Promise.resolve();
		})
	}, Promise.resolve())
	.then(()=>{
		this.results.end = new Date();
		this.results.runTime = this.results.end - this.results.start;
		this._isCompleted = true;
		this._distibute();
		this.emit('complete');
	})
	.catch((error)=>
	{
		this.emit('error',error);
	})
	return this
}

util.inherits(Report, Readable);
module.exports = Report



