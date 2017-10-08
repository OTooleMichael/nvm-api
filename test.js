const NVM = require('./index');
const CONFIG = require('./config');
const moment = require('moment');


function start()
{
	let i = 0;
	var nmv = new NVM(CONFIG);
	let report = nmv.report({
		report:"INBOUND",
		start:'2017-06-01',
		end:'2017-06-15'
	})
	.limit(400)
	/*
	.run(function(err,result){
		console.log(result);
		console.log(result.rows.length);
	})
	*/
	.stream()
	.on('data',function(row){
		console.log(row);
		console.log(i++);
	})
	.on('error',function(err){
		console.log(err)
	})
	.on('end',function(){
		console.log("ALL done");
		console.log(this.results);
	})
	;
}
start();