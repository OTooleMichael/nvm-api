const moment = require('moment');
const { validDates , datesToDateList ,myError } = require('./tools');
const EventEmitter = require('events').EventEmitter;
const util = require('util');
function Report(params,client)
{
	EventEmitter.call(this);
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
	return this
}

Report.prototype.getDataParams = function(p){
	p.endpoint = this.endpoint;
	if(this.endpoint == 'outboundcalls' || this.endpoint == 'inboundcalls'){
		p.additionalfield = 'uniqueid'
	};
	return p;
}
Report.prototype.run = function(cb) {
	if(this._started) return;
	this._started = true;
	this.results.start = new Date();
	let Q = Promise.resolve();
	this.pages.forEach((p)=>{
		p = this.getDataParams(p);
		Q = Q.then(()=> this.client.getData(p) )
		.then((rows)=>{
			this.results.count += rows.length;
			this.results.calls ++;
			this.rows = this.rows.concat(rows);
			return Promise.resolve();
		})
	});
	Q = Q.then(()=>{
		this.results.end = new Date();
		this.results.runTime = this.results.end - this.results.start
	})
	if(typeof cb == "function")
	{
		Q = Q.then(()=>
		{
			this.results.rows = this.rows;
			cb(null,this.results)
		})
		.catch(cb);
		return 
	}
	else
	{
		Q = Q.then(()=>{
			this.results.rows = this.rows;
			return Promise.resolve(this.results)
		});
		return Q;
	}
};
Report.prototype.then = function(fn){
	return this.run(undefined).then(fn)
}
Report.prototype.stream  = function(){
	if(this._started) return;
	this._started = true;
	this.results.start = new Date();
	let Q = Promise.resolve();
	this.pages.forEach((p)=>{
		p = this.getDataParams(p);
		Q = Q.then(()=> this.client.getData(p) )
		.then((rows)=>{
			this.results.count += rows.length;
			this.results.calls ++;
			rows.forEach((row)=> this.emit('data',row) )
			this.emit('progress',{
				type:"PAGE",
				timeRange:p,
				call:this.results.calls,
				rowsReturned:rows.length
			});
			return Promise.resolve();
		})
	});
	Q = Q.then(()=>{
		this.results.end = new Date();
		this.results.runTime = this.results.end - this.results.start;
		this.emit('end');
	})
	.catch((error)=>
	{
		this.emit('error',error);
	})
}

util.inherits(Report, EventEmitter);
module.exports = Report



