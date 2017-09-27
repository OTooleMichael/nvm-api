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
					if(str.search('Unauthorized: Access is denied due to invalid credentials') != -1)
					{
						return reject({error:'ACCESS_DENIED',response:str});
					}
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
	let required = {
		start:null,
		end:null,
		endpoint:"string",
		token:"string",
		CLOUD:"string",
		ACCOUNT_KEY:"string"
	};
	for(var el in required)
	{
		if(!params[el] || required[el] && typeof params[el] !== typeof required[el])
		{
			return Promise.reject({error:'MISSING_PARAMS',message:el +" is a required param"})
		}
	}
	let {  start, end, endpoint } = params;
	let validEndpoint = [
		'inboundcalls',
		'outboundcalls',
		'agentstates'
	].some((el)=> endpoint == el);
	if(!validEndpoint)
	{
		return Promise.reject({error:'INVALID_ENPOINT',message:endpoint +" : was provided as an endpoint"})
	}
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
	let data = {
	    'start': start.toISOString(),
	    'end': end.toISOString()
	};
	// https://newvoicemedia.atlassian.net/wiki/spaces/DP/pages/55705816/Retrieving+outbound+call+statistics
	['additionalfield'].forEach(function(el)
	{
		if(params[el]){
			data[el] = params[el]
		};
	})
	data = querystring.stringify(data)
	let options = {
		host: params.CLOUD+'.contact-world.net',
		port: 443,
		path: `/v0/${params.ACCOUNT_KEY}/statistics/${params.endpoint}?${data}`,
		method: 'GET',
		headers: {
			Authorization: 'Bearer '+params.token,
			'Accept':'application/json; version=2',
			'Content-Type': 'application/x-www-form-urlencoded'
		}
	};
	return request({options:options,data:data})
	.then(function(res){
		if(res.message == 'The request is invalid.')
		{
			res.error = "INVALID_REQUEST";
			return Promise.reject(res);
		}
		return Promise.resolve(res.calls);
	});
}

module.exports = {
	getData:getData,
	getBearerToken:getBearerToken
}