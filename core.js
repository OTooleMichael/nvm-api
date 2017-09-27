const https = require('https');
const querystring = require('querystring');
const moment  = require('moment');

function request(params)
{
	let {options , data} = params;
	let str = '';
	return new Promise(function(resolve,reject)
	{
		let request = https.request(options, function(res) {
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
			  str+=chunk
			});
			res.on('error',reject);
			res.on('end',function(){
				try{
					let response = JSON.parse(str);
					if(response.error)
					{
						return reject(response)
					}
					else
					{
						return resolve(response);
					}
				}
				catch(e)
				{
					return reject({
						error:e,
						response:str
					});
				}
			});
		});
		if(options.method == 'POST')
		{
			request.write(data);// post the data
		};
		request.end();
	});
}

function getBearerToken(keys)
{
	let data = querystring.stringify({
	      'grant_type' : 'client_credentials',
	      'client_id': keys.ACCOUNT_KEY,
	      'client_secret': keys.CLIENT_SECRET
	});
	let options = {
		host: keys.CLOUD+'.contact-world.net',
		port: 443,
		path: '/v0/oauth2/token',
		method: 'POST',
		headers: {
		  'Content-Type': 'application/x-www-form-urlencoded',
		  'Content-Length': Buffer.byteLength(data)
		}
	};
	return request({options:options,data:data})
	.then(function(res){
		// "expires_in":3600
		return Promise.resolve(res.access_token);
	});
};


function getData(params)
{
	/*
	curl -X GET "https://cloudx.contact-world.net/v0/a1b2c3d4e5/statistics/inboundcalls?
	start=2014-02-10T15:00:00Z&end=2014-02-11T07:15:00Z" 
	-H "Authorization: Bearer <ACCESS_TOKEN>" -H "Accept: application/json; version=2
	*/
	let {  start, end } = params;
	start = moment(start);
	end = moment(end);
	if(!moment(start).isValid() || !moment(end).isValid())
	{
		return Promise.reject({error:'INVALID_DATES',message:"invalid date format"})
	}
	if(start > moment() || end > moment())
	{
		return Promise.reject({error:'INVALID_DATES',message:"start or end is in the future"})
	}
	if(start > end)
	{
		return Promise.reject({error:'INVALID_DATES',message:"start is greater than end date"})
	};
	let data = querystring.stringify({
	      'start': start,
	      'end': end
	});
	let options = {
		host: params.CLOUD+'.contact-world.net',
		port: 443,
		path: `/v0/${params.ACCOUNT_KEY}/statistics/${endpoint}?${data}`,
		method: 'GET',
		headers: {
			Authorization: 'Bearer '+params.token,
			'Accept':'application/json; version=2',
			'Content-Type': 'application/x-www-form-urlencoded'
		}
	};
	return request({options:options,data:data})
	.then(function(res){
		// "expires_in":3600
		return Promise.resolve(res.calls);
	});
}

module.exports = {
	getData:getData,
	getBearerToken:getBearerToken
}