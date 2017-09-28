const expect = require('chai').expect;
const nock = require('nock');
const Report = require('./Report');
const DATA = {
	SAMPLE_INBOUND:[
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
describe('Report Element', function() {
	let MOCK_CLIENT = {
		getData:function(params){
			let data = {};
			switch(params.endpoint)
			{
				case 'SAMPLE_INBOUND':
					data = DATA.SAMPLE_INBOUND
				break;
			}
			return Promise.resolve(data);
		}
	}
	/*
  beforeEach(function() {
    // Mock the TMDB configuration request response
    nock(`https://${CONFIG.CLOUD}.contact-world.net`)
      .post('/v0/oauth2/token')
      .reply(200, {access_token:"SAMPLE_TOKEN"});
	})
	*/
  it('Sample Inbound : 3 calls', function(done) {
  		let r = new Report({
  			start:"2017-01-01",
  			end:"2017-01-04",
  			report:'INBOUND'
  		},MOCK_CLIENT);
  		r.endpoint = 'SAMPLE_INBOUND';
  		r.run(function(err,res)
  		{
  			expect(res.count).to.equals(3);
  			expect(res.calls).to.equals(3);
  			done()
  		})
	});
    it('Sample Inbound : 1 Results', function(done) {
  		let r = new Report({
  			start:"2017-01-01",
  			end:"2017-01-02",
  			report:'INBOUND'
  		},MOCK_CLIENT);
  		r.endpoint = 'SAMPLE_INBOUND';
  		r.run(function(err,res)
  		{
  			expect(res.rows[0]).to.equals(DATA.SAMPLE_INBOUND[0]);
  			done()
  		})
	});
});




