const NVM = require('./NVM');
const CONFIG = require('./config');
const moment = require('moment');


function start()
{
	var nmv = new NVM(CONFIG);
	let report = nmv.newReport({
		report:"INBOUND",
		start:'2017-06-01',
		end:'2017-06-04'
	})
	.on('data',function(row){
		console.log(row);
	})
	.on('error',function(err){
		console.log(err)
	})
	.on('end',function(){
		console.log("ALL done");
		console.log(this.results);
	})
	.stream();
}
start();