# nvm-api
New Voice Media Node Wrapper - for stats


``` npm install new-voice-media --save ```

## Usage

Create a global connection to the service using your private keys. Authentication is then handled internally.

```javascript
	const CONFIG = {
		ACCOUNT_KEY:'ACCOUNT',
		CLIENT_SECRET:'SECRET',
		CLOUD:'cloud11'
	};

	const nmv = new NVM(CONFIG);
	// nmv object from which to run reports

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


## Promises and Callback
If data is not streamed it will be buffered all into memory before the end ofthe call. This should be ok for smaller requests.

```javascript
	let report = nmv.newReport({
		report:"OUTBOUND",
		start:'2017-06-01',
		end:'2017-06-04'
	}).run(function(err,rows){
		if(err) return console.log(err);
		console.log(rows);
	});
```
