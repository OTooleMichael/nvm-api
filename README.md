# nvm-api
New Voice Media Node Wrapper - for stats


``` npm install new-voice-media --save ```

## Usage

Create a global connection to the service using your private keys

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
