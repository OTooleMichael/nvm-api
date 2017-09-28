const moment = require('moment');
function myError(obj){
	let e = new Error(obj.error);
	e.details = obj.message;
	return e
}
function validDates(params)
{
	let { start , end } = params;
	start = moment(start);
	end = moment(end);
	if(!moment(start).isValid() || !moment(end).isValid())
	{
		throw myError({error:'INVALID_DATES',message:"invalid date format"})
	}
	if(start > moment() || end > moment())
	{
		throw myError({error:'INVALID_DATES',message:"start or end is in the future"})
	}
	if(start > end)
	{
		throw myError({error:'INVALID_DATES',message:"start is greater than end date"})
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
		endPart = (endPart > end) ? end : endPart;
		pages.push({
			start:moment(current),
			end:(endPart > moment()) ? moment() : endPart
		});
		current = current.startOf('day').add(1,'day');
	};
	return pages
}



module.exports = {
	datesToDateList:datesToDateList,
	validDates:validDates,
	myError:myError
}





