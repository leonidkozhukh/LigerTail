/*!
 * jQuery Rolling Counter
 * 
 * Copyright 2011, Yuriy Zisin
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
Counter = function ($object, options) {
    this.options= {
        minDigitSpinDelay: 10,
        maxDigitSpinDelay: 100,
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
    if (this.delay == Infinity || this.delay <= 0) {
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
