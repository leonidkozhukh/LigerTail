/* 
* spin counter based on:
* jQuery Rolling Counter 0.0.1 
* Copyright 2011, Yuriy Zisin
* 
* implementation
* MAS for Ligertail 2012
*/
Counter = function ($object, options) {
    this.options= {
        minDigitSpinDelay: 200,
        maxDigitSpinDelay: 800,
        spinTime: 5000,
        stopDigit: 0,
        startDigit:0,
        onFinish: null
    };
    $.extend(this.options, options);
    this.$object = $object;
    this.$image = $('img', $object);
    this.digitHeight = $object.height();
    this.currentDigit = this.options.startDigit;
    this.currentDelay = this.options.minDigitSpinDelay;
    this.distance = 0;
    
    //Converting to physical values
    var minVelocity = 1000/this.options.maxDigitSpinDelay;
    var maxVelocity = 1000/this.options.minDigitSpinDelay;
    var spinTime = this.options.spinTime/1000;
    
    //Calculating acceleration
    var a = (minVelocity - maxVelocity)/spinTime;
    //Calculating distance we pass using acceleration, velocity and time
    var s = (maxVelocity*spinTime)+((a*Math.pow(spinTime, 2))/2);
    //Calculating distance we have to spin on
    var completeSpins = Math.floor(s/10);
    s = completeSpins * 10 - this.options.startDigit + this.options.stopDigit;
    //This is the distance we have to spin on
    this.targetDistance = s;
    //Calculate the each digit delay by arythmetical progression
    this.delay = (((2*this.options.spinTime)/s)-2*this.options.minDigitSpinDelay)/(s-1);
    //MAS *** handle for bad delay values **
    if (this.delay == Infinity || this.delay <= 0 || isNaN(this.delay)) {
        this.delay = 1
    }
    return this;
};
//This method animates the counter
Counter.prototype.run = function() {
    var animateEnd = function(counterEngine) {
        return function() {
            counterEngine.currentDigit++;
            if (counterEngine.currentDigit > 10) {
                counterEngine.$image.animate({
                    marginTop:0
                },1);
                counterEngine.currentDigit = 1;
            }
            counterEngine.currentDelay += counterEngine.delay;
            counterEngine.distance ++;
            if (counterEngine.distance <= counterEngine.targetDistance) {
                counterEngine.run();
            } else if (counterEngine.options.onFinish) {
                counterEngine.options.onFinish(counterEngine.$object);
            }
        }
    }(this);
    this.$image.animate({
        marginTop: -(this.currentDigit*this.digitHeight)
    }, this.currentDelay, 'linear', animateEnd);
    return this;
};
$.fn.extend({
    spinCounter: function(options, finishCallback) {
        this.each(function() {
            $.extend(options, {onFinish: finishCallback});
            new Counter($(this), options).run();
        });
        return this;
    }
});

//instance globals
var _spinInterval = 200;
var _minDigitSpinDelay = 10;
var _maxDigitSpinDelay = 100;
var _digitID = '#digit';
var _totalDigits;   //set in $(document).ready               
var _maxNum;        //set in $(document).ready               
var _currentClicks = 0;
var _digits = [];
var _startFlag = true;
var _resetFlag = false;    
var _err;
var jq$ = $; 
/*  
    replace $ to prevent jqery namespace conflicts 
    as ligertail widget is loading jquery 1.5 on page 
*/ 
function setClicks(clicks) { 
	
    if (_resetFlag && !_startFlag) {
        _startFlag = true;
        for (var i=1; i <= _totalDigits;i++) {
            jq$(_digitID +i).find('img').css('visibility','hidden');//show counter digits
        }
        _currentClicks = 0;
    }
    var diffClicks = 0;
    var oldC = _currentClicks;
    if (!_startFlag) {
        if (clicks < _currentClicks){ //prevent decrementing
            var oldC = 0;
            clicks = _currentClicks;
        } else if (clicks >= _currentClicks) { 
            _currentClicks = clicks;        //update global
            var diffClicks = clicks-oldC;   //calculate diffClicks
        } 
    } else {
        _currentClicks = clicks;
        diffClicks = _totalDigits;
    }
    var c = clicks.toString();
    var oldC = oldC.toString();
    numDigits = c.length;
    while (c.length > oldC.length) {
       oldC = '0' + oldC;   //add zeros so old & new have same number of digits
    }      
    for (var i=numDigits; i>=0; i--) {
        _digits[i] = [];
        _digits[i]['start'] = parseInt(oldC.charAt(i));
        _digits[i]['stop'] = parseInt(c.charAt(i));
    }
    var changeDigits = (diffClicks)? diffClicks.toString().length : 0;
    if (!_startFlag && diffClicks) {
        var firstChangedNumber;
        for (var i=numDigits-1; i>=0; i--) {
            if (_digits[i]['start']!=_digits[i]['stop']) {
               firstChangedNumber=numDigits-i;
            } 
        }
    } else if (_startFlag) {
        changeDigits = numDigits;
    }
    if (firstChangedNumber && (changeDigits <= firstChangedNumber)) {
        changeDigits = firstChangedNumber;
    }
    if (changeDigits) {    
        for (var i=changeDigits; i>0; i--) {
            var charPos = numDigits - i; //reverse positions
            var start = _digits[charPos]['start'];
            var stop = _digits[charPos]['stop'];
            var minDelay = _minDigitSpinDelay;
            var maxDelay = _maxDigitSpinDelay 
            var spinInterval =_spinInterval;
            jq$(_digitID + i).find('img').css('visibility','visible');//show counter digits
            if (changeDigits==1) { // faster if only digit changing
                var distance = 11 - (Math.abs(stop-start));
                if (distance==10) {
                    var minDelay = 100;
                // if just one increment (distance==10) make it spin slower 
                } else {
                    var spinInterval =  (_spinInterval/distance) * 2;  
                //spin more if
                }
            }
            jq$(_digitID + i).spinCounter({
                spinTime: spinInterval, 
                startDigit:start, 
                stopDigit:stop,
                minDigitSpinDelay: minDelay,
                maxDigitSpinDelay: maxDelay
            });
       }
    }
    if (_startFlag) {
        _startFlag = false;
    } 
    setTimeout("getClicks();",_timerIntervalSecs * 1000);
}

function getPublisherStats(response){
	jQuery.each(response.publisherSites, function(i, site){
		var site_obj = jQuery.parseJSON(site);
		
		var clicks = parseInt(site_obj.timedStats[Duration.WEEKLY][1][2]);
		var closes = parseInt(site_obj.timedStats[Duration.WEEKLY][1][4]);
		var c = clicks + closes;
		if (c>=0 && c<=_maxNum) {
            setClicks(c);
        } else {
            _err = true;
            //setTimeout("getClicks();",9000);//wait 10 secs
        }
    });
}

function getClicks() {
	jq$.ajax({
        cache: false,
        url: _url,
        success: function(data) {
            _err = false;
            _resetFlag = (data.reset==true)? true : false;
            //var c = parseInt(data.clicks);
            if (typeof window.api == 'undefined')  {
            	//setTimeout("getClicks();",500);
            } else  {
            	window.api.getPublisherSiteStats(window.PUBLISHER_URL, 'getPublisherStats');
            }
        },
        error: function() {
            _err = true;   
        }
    });
}
jq$(document).ready (function() {
    _totalDigits = jq$('.counter').length; //number of digits available for display
    var max = '9';
    while (max.length<_totalDigits) {
        max += '9';// build maximum displayable number
    }
    _maxNum = parseInt(max);
    if (_totalDigits>=1) {
        getClicks();
    } else {
        _err = true;
    }
});