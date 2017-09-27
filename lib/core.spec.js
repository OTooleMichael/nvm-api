const core = require('./core');
const expect = require('chai').expect;
const nock = require('nock');
const CONFIG = {
	ACCOUNT_KEY:'account',
	CLIENT_SECRET:'CLIENT_SECRET',
	CLOUD:'cloud11'
}

describe(' getBearerToken', function() {
  beforeEach(function() {
    // Mock the TMDB configuration request response
    nock(`https://${CONFIG.CLOUD}.contact-world.net`)
      .post('/v0/oauth2/token')
      .reply(200, {access_token:"SAMPLE_TOKEN"});

    let inboundRes = {
		"count":1,
		"calls":[
			{
				"connectedTo":"531752149",
				"serviceName":"",
				"callGuid":"01442fd6-7fa8-49f1-b1d1-8f8b38630c15",
				"origin":"01234567890",
				"stateChangedAt":"2014-02-14T12:35:49Z",
				"sequence":3,
				"appletName":"ACD318",
				"event":"End",
				"state":"Caller",
				"duration":"00:00:28"
			}
		]
	}
    nock(`https://${CONFIG.CLOUD}.contact-world.net`)
      .get(`/v0/${CONFIG.ACCOUNT_KEY}/statistics/inboundcalls`)
      .query(true)
      .reply(200, inboundRes);


    nock(`https://${CONFIG.CLOUD}.contact-world.net`, {
      reqheaders: {
        'Authorization': 'Bearer WRONG_TOKEN'
      }
    })
      .get(`/v0/${CONFIG.ACCOUNT_KEY}/statistics/inboundcalls`)
      .query(true)
      .reply(403, '<div>Unauthorized: Access is denied due to invalid credentials</div>');
  });

  it('Returns bearer Token', function(done) {
    core.getBearerToken(CONFIG).then(function(token) {
      expect(token).to.equal("SAMPLE_TOKEN");
      done();
    });
  });

  it('Rejects Enpoint', function(done) {
  	let params = Object.assign({
		endpoint:"WRONG",
		start:"2017-01-01",
		end:"2017-01-02",
		token:"token"
	},CONFIG);
    core.getData(params).catch(function(error) {
      // It should return an array object
      expect(error.error).to.equal("INVALID_ENPOINT");
      done();
    });
  });

  it('Rejects mis.ordered Dates', function(done) {
  	let params = Object.assign({
  		endpoint:"inboundcalls",
  		start:"2017-01-03",
  		end:"2017-01-01",
  		token:"token"
  	},CONFIG);
    core.getData(params).catch(function(error) {
      // It should return an array object
      expect(error.error).to.equal("INVALID_DATES");
      done();
    });
  });
  
  it('Rejects future Dates', function(done) {
  	let params = Object.assign({
  		endpoint:"inboundcalls",
  		start:new Date(new Date() + 1000*60*60),
  		end:"2017-01-01",
  		token:"token"
  	},CONFIG);
    core.getData(params).catch(function(error) {
      // It should return an array object
      expect(error.error).to.equal("INVALID_DATES");
      done();
    });
  });
  it('Rejects No Token', function(done) {
  	let params = Object.assign({
  		endpoint:"inboundcalls",
  		start:"2017-01-01",
  		end:"2017-01-02",
  		token:undefined
  	},CONFIG)
    core.getData(params).catch(function(error) {
      // It should return an array object
      expect(error.error).to.equal("MISSING_PARAMS");
      expect(error.message).to.equal("token is a required param");
      done();
    });
  });
  it('Get Inbound Calls', function(done) {
  	let params = Object.assign({
  		endpoint:"inboundcalls",
  		start:"2017-01-01",
  		end:"2017-01-02",
  		token:"token"
  	},CONFIG)
    core.getData(params).then(function(res) {
      // It should return an array object
      expect(res).to.be.an('array').that.does.not.include(3);
      expect(res).to.have.a.lengthOf(1);
      expect(res[0]).to.have.all.keys([
  			"connectedTo",
  			"serviceName",
  			"callGuid",
  			"origin",
  			"stateChangedAt",
			"sequence",
			"appletName",
			"event",
			"state",
			"duration"
		]);
      done();
    });
  });
  it('Refuses Auth', function(done) {
  	let params = Object.assign({
  		endpoint:"inboundcalls",
  		start:"2017-01-01",
  		end:"2017-01-02",
  		token:"WRONG_TOKEN"
  	},CONFIG)
    core.getData(params).catch(function(error) {
      // It should return an array object
      expect(error.error).equals('ACCESS_DENIED')
      done();
    });
  });
});










