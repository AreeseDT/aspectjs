(function(exports) {
    'use strict';    
    exports(function(){
        function aspect(obj, target) {
            return getAspect(obj, target);
        }

        aspect.before = aspectFactory('before');
        aspect.around = aspectFactory('around');
        aspect.after = aspectFactory('after');

        function Pointcut(obj, target) {
            var self = this;
            this.obj = obj;
            this.target = target;

            var advisors = this.advisors = {};
            this.original = this.obj[this.target];

            var advice = this.advice = function() {
                var context = this;
                var args = Array.prototype.slice.call(arguments);

                self._call('before', context, args);
                var result = self._around(context, args);
                self._call('after', context, args);

                return result;
            };

            advice._aspect = self;
        }

        Pointcut.prototype = {

            _call: function(type, context, args){
                var advisors = this.advisors[type];
                if(!advisors) return;

                iterate(advisors, function(advice) {
                    advice.apply(context, args);
                });
            },

            _around: function(context, args) {
                return this.original.apply(context, args);
            },

            _addAdvice: function(type, fn) {
                if(type == 'around') return this.around(fn);

                var advisors = this.advisors[type] || (this.advisors[type] = []);
                type == 'before' ? advisors.unshift(fn) : advisors.push(fn);
            },

            before: function(fn) {
                this._addAdvice('before', fn);
                return this;
            },

            after: function(fn) {
                this._addAdvice('after', fn);
                return this;
            },

            around: function(fn) {
                var original = this.original;

                this.original = function() {
                    var context = this;

                    var args = Array.prototype.slice.call(arguments);

                    function next(args) {
                        if(original){
                            return original.apply(context, args);
                        } else {
                            return undefined;
                        }
                    }

                    function proceed() {
                        return next(arguments.length ? Array.prototype.slice.call(arguments) : args);
                    }

                    return fn.call(context, proceed);
                };

                return this;
            }
        };

        function getAspect(obj, target) {
            var fn = obj[target];
            if(!fn) return;
            
            var aspect = fn._aspect;
            if(!aspect) {
                aspect = new Pointcut(obj, target);
                obj[target] = aspect.advice;
            }
            return aspect;
        }

        function aspectFactory(type) {
            return function(obj, target, fn) {
                var aspect = getAspect(obj, target);
                aspect._addAdvice(type, fn);
            };
        }

        exports.pointcut = function(obj, fn) {
            return new Pointcut(obj, fn);
        };

        var isArray = Array.isArray || function(x) {
            return Object.prototype.toString.call(x) == '[object Array]';
        };

        function iterate(list, fn, reverse) {
            var i;
            if(reverse) {
                for(i = list.length - 1; i >= 0; i--) {
                    fn(list[i]);
                }
            } else {
                for(i = 0; i < list.length; i++) {
                    fn(list[i]);
                }
            }
        }

        return aspect;
    }); 
})(typeof define === 'function' && define.amd ? 
    define : 
    function(fn) { 
        'use strict';
        module.exports = fn();
    }
);


