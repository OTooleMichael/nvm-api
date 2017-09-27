const moment = require('moment');
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
		throw new Error({error:"INVALID REPORT TYPE",message:params })
	}
	this.params = Object.assign({},params);
	this._prepPages();
	this.client = client;
	return this
}
Report.prototype._prepPages = function() {
	this.pages =  dayList(this.params);
	function dayList(params){
		let pages = [];
		let { start , end } = params;
		start = moment(start);
		end = moment(end);
		if(!moment(start).isValid() || !moment(end).isValid())
		{
			throw new Error({error:'INVALID_DATES',message:"invalid date format"})
		}
		if(start > moment() || end > moment())
		{
			throw new Error({error:'INVALID_DATES',message:"start or end is in the future"})
		}
		if(start > end)
		{
			throw new Error({error:'INVALID_DATES',message:"start is greater than end date"})
		};
		let current = moment(start);
		while(current < end)
		{
			pages.push({
				start:moment(current),
				end:moment(current).endOf('day')
			});
			current = current.add(1,'day');
		};
		if(end > current){
			pages.push({
				start:moment(current),
				end:end
			});
		}
		return pages
	}
};
Report.prototype.run = function(cb) {
	if(this._started) return;
	this._started = true;
	this.results.start = new Date();
	let Q = Promise.resolve();
	this.pages.forEach((p)=>{
		p.endpoint = this.endpoint;
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
			cb(null,this.results)
		})
		.catch(cb);
		return 
	}
	else
	{
		Q = Q.then(()=>{
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
		p.endpoint = this.endpoint;
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



