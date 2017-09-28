const { validDates , datesToDateList } = require('./tools');
const moment = require('moment');
const expect = require('chai').expect;
describe(' Tools Spec', function() {
	it('Valid Dates (Str)', function(done) {
		let res = validDates({start:'2017-01-01',end:'2017-01-02'});
		expect(res).to.equal(true);
		done();
	});
	it('Valid Dates (Date)', function(done) {
		let res = validDates({start:new Date('2017-01-01'),end:new Date()});
		expect(res).to.equal(true);
		done();
	});
	it('Valid Dates (moment)', function(done) {
		let res = validDates({start:moment('2017-01-01'),end:moment()});
		expect(res).to.equal(true);
		done();
	});
	it('Reject Dates (bad format)', function(done) {
		expect(function(){
			validDates({start:'2017-01-01',end:"LEMON"});
		})
		.to.throw(Error)
		.that.has.property('details')
		.that.equals("invalid date format");
		done();
	});
	it('Reject Dates (end before start)', function(done) {
		expect(function(){
			validDates({start:'2017-02-01',end:'2017-01-01'});
		})
		.to.throw(Error)
		.that.has.property('details')
		.that.equals("start is greater than end date");
		done();
	});
	it('Reject Dates (in future)', function(done) {
		expect(function(){
			validDates({start:'2017-02-01',end:moment().add(2,'days')});
		})
		.to.throw(Error)
		.that.has.property('details')
		.that.equals("start or end is in the future");
		done();
	});
	it('Makes Simple Date List', function(done) {
		let expected = [{"start":"2017-01-01T00:00:00.000Z","end":"2017-01-01T23:59:59.999Z"},{"start":"2017-01-02T00:00:00.000Z","end":"2017-01-02T23:59:59.999Z"}];
		let res = datesToDateList({start:'2017-01-01',end:'2017-01-03'})
		expect(res).to.be.an('array').of.length(2)
		expect(JSON.stringify(res)).to.equal(JSON.stringify(expected))
		done();
	});
	it('Makes Mid Day End Date Date List ', function(done) {
		let expected = [{"start":"2017-01-01T00:00:00.000Z","end":"2017-01-01T23:59:59.999Z"},{"start":"2017-01-02T00:00:00.000Z","end":"2017-01-02T20:00:00.000Z"}];
		let res = datesToDateList({start:'2017-01-01',end:'2017-01-02T20:00:00.000Z'})
		expect(res).to.be.an('array').of.length(2)
		expect(JSON.stringify(res)).to.equal(JSON.stringify(expected))
		done();
	});
	it('Makes Date List Ending Today', function(done) {
		let yesterday = moment().subtract(1,'day').startOf('day');
		let now = moment()
		let expected = [{"start":yesterday,"end":moment(yesterday).endOf('day')},{"start":moment().startOf('day'),"end":now}];
		let res = datesToDateList({start:moment().subtract(1,'day').startOf('day'),end:now})
		expect(res).to.be.an('array').of.length(2)
		expect(JSON.stringify(res)).to.equal(JSON.stringify(expected))
		done();
	});
})
/*
function validDates(params)
{
	let { start , end } = params;
	start = moment(start);
	end = moment(end);
	if(!moment(start).isValid() || !moment(end).isValid())
	{
		throw new Error({error:'INVALID_DATES',message:"invalid date format"})
	}
	if(start > moment() || end > moment())
	{
		throw new Error({error:'INVALID_DATES',message:"start or end is in the future"})
	}
	if(start > end)
	{
		throw new Error({error:'INVALID_DATES',message:"start is greater than end date"})
	};
	return true
};
function datesToDateList(params){
	let pages = [];
	let { start , end } = params;
	start = moment(start);
	end = moment(end);
	let current = moment(start);
	while(current < end )
	{
		let endPart = moment(current).endOf('day');
		pages.push({
			start:moment(current),
			end:(endPart > moment()) ? moment() : endPart
		});
		current = current.add(1,'day');
	};
	if(end > current){
		pages.push({
			start:moment(current),
			end:end
		});
	}
	return pages
}
*/



