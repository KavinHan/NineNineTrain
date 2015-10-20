var util = {};

util.getRandom = function( min, max ) {
	return Math.floor( Math.random() * (max - min + 1) ) + min;
};

util.getQuestion = function(  ) {
  // 0: +
  // 1: -
  // 2: *
  // 3: /
	var symbol = util.getRandom(0, 3);
	var arr = [util.getRandom(1, 9), 0, util.getRandom(1, 9)];
	switch(symbol) {
		case 0:
      arr[1] = 0;
			break;
		case 1:
      arr[0] = arr[2] + util.getRandom(0, 9);
      arr[1] = 1;
			break;
		case 2:
      arr = [util.getRandom(0, 9), 2, util.getRandom(0, 9)];
			break;
		case 3:
      arr[0] = arr[2] * util.getRandom(1, 9);
      arr[1] = 3;
			break;
		default:
			return false;
	};
	return arr;
};

util.getPoint = function(time, level, combo) {
	return time * (level * 2) + combo;
};
/**
 * q: array [left number, symbol, right number]
 */
util.getAnswer =  function( q ) {
	var answer = 0;
	switch(q[1]) {
		case 0:
			answer = q[0] + q[2];
			break;
		case 1:
			answer = q[0] - q[2];
			break;
		case 2:
			answer = q[0] * q[2];
			break;
		case 3:
			answer = q[0] / q[2];
			break;
		default:
			return 9999;
	};
	return answer;
};

util.getRecord = function( playTime, score, combo ) {
	if ( score === 0 ) { return false; }
	var t = new Date();
	var id = t.getTime();
	var year = t.getFullYear();
	var month = t.getMonth() + 1;
	var day = t.getDate();
	var week = util.getWeekNum(year, month, day);
	var date = year + '-' + month + '-' + day + '-' + week;
	var record = {
		id: id,
		playerName: 'kavin-pc',
		date: date,
		score: score,
		playTime: playTime,
		combo: combo
	};
	return record;
};

util.getSortRecords = function( arr ) {
	return arr.sort(function(a, b) {
		return a.score - b.score;
	});
};

util.changeResults = function( results ) {
	var arr = [];
	var obj = {};
	var i;
	for ( i = 0; i < results.length; i++ ) {
		obj = {
			score : results[i].get('score'),
			playTime : results[i].get('playTime'),
			combo : results[i].get('combo')
		};
		arr.push(obj);
	};
	return arr;
};

util.getWeekNum = function(year, month, day) {
	var yearFirstDay = new Date(year, 0, 1);
	var nowDay = new Date(year, (month-1), day);

	return Math.ceil((((nowDay - yearFirstDay) / 86400000) + yearFirstDay.getDay()+1)/7);
};

util.classToArray = function ( obj ) {
	var ocn = obj.className,
		arr = ocn.split(' ');
	return arr;
};
