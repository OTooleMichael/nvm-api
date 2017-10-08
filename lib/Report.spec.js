const {expect, assert} = require('chai');
const nock = require('nock');
const sinon = require('sinon')
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
					data = [Object.assign({},DATA.SAMPLE_INBOUND[0])]
				break;
			}
			return Promise.resolve(data);
		},
		access_token:"SAMPLE_TOKEN"
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
  			expect(res.rows[0]).to.deep.equals(DATA.SAMPLE_INBOUND[0]);
  			done()
  		})
	});
    it('Limit to 2 on Stream', function(done) {
		this.timeout(3000*10)
  		let r = new Report({
  			start:"2017-01-01",
  			end:"2017-01-06",
  			report:'INBOUND'
  		},MOCK_CLIENT);
  		r.endpoint = 'SAMPLE_INBOUND';
  		let i = 0;
  		r.limit(2).stream()
  		.on('data',function(data){
  			i++;
  		})
  		.on('end',function(){
  			expect(i).to.equal(2)
  			done()
  		})
	});
	it('6 Days of Calls on Stream', function(done) {
  		let r = new Report({
  			start:"2017-01-01",
  			end:"2017-01-06T00:00:00.000Z",
  			report:'INBOUND'
  		},MOCK_CLIENT);
  		r.endpoint = 'SAMPLE_INBOUND';
  		let i = 0;
  		let push = sinon.spy(r,'push')
  		r.stream()
  		.on('data',function(data){
  			i++;
  		})
  		.on('end',function(){
  			expect(push.callCount).to.equal(6); // including the null
  			expect(i).to.equal(5)
  			done()
  		})
	});
	it('Streams Pauses', function(done) {
		this.timeout(3000)
  		let r = new Report({
  			start:"2017-01-01",
  			end:"2017-01-03",
  			report:'INBOUND'
  		},MOCK_CLIENT);
  		r.endpoint = 'SAMPLE_INBOUND';
  		let res = [];
  		r.stream().on('data',function(data){
  			res.push(Date.now());
  			this.pause();
  			setTimeout(()=>this.read(),10)
  		})
  		.on('end',function(){
  			assert.isAtLeast(res[1] - res[0],10)
  			done()
  		})
	});
});




