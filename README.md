# nvm-api
New Voice Media Node Wrapper - for stats


``` npm install new-voice-media --save ```

## Usage

Create a global connection to the service using your private keys. Authentication is then handled internally.

```javascript
	const CONFIG = {
		ACCOUNT_KEY:'ACCOUNT',
		CLIENT_SECRET:'SECRET',
		CLOUD:'cloud11',
		throttling:500 // optional (default: 400ms) reduce the speed of calls centrall from the NVM connection
	};

	const nmv = new NVM(CONFIG);
	// nmv object from which to run reports
	module.exports = nvm;
	// this object will maintain authentication cetrally so other moduels can create reports easily

```


## Streaming
Streaming data from the a report can be achieved. This avoids buffering anything into memory.
```javascript
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
```

Stream Method can be piped directly
```javascript
	let transform = new Transform({
		writableObjectMode:true,
		transform:(row)=>{return this.push(JSON.stringify(row)+'\n')}
	};)
	let newFile = fs.createWriteStream('./file.txt')
	let report = nmv.newReport({
		report:"INBOUND",
		start:'2017-06-01',
		end:'2017-06-04'
	})
	.stream().pipe(transform).pipe(newFile);
```

## Promises and Callback
If data is not streamed it will be buffered all into memory before the end ofthe call. This should be ok for smaller requests.

```javascript
	let report = nmv.newReport({
		report:"OUTBOUND",
		start:'2017-06-01',
		end:'2017-06-04'
	})
	.limit(10000)
	.run(function(err,results){
		if(err) return console.log(err);
		console.log(results.rows);
	});
```
