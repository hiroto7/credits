!function(e){var t={};function r(n){if(t[n])return t[n].exports;var i=t[n]={i:n,l:!1,exports:{}};return e[n].call(i.exports,i,i.exports,r),i.l=!0,i.exports}r.m=e,r.c=t,r.d=function(e,t,n){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},r.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"===typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var i in e)r.d(n,i,function(t){return e[t]}.bind(null,i));return n},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="./",r(r.s=2)}([function(e,t,r){e.exports=r(1)},function(e,t,r){var n=function(e){"use strict";var t=Object.prototype,r=t.hasOwnProperty,n="function"===typeof Symbol?Symbol:{},i=n.iterator||"@@iterator",o=n.asyncIterator||"@@asyncIterator",a=n.toStringTag||"@@toStringTag";function s(e,t,r){return Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}),e[t]}try{s({},"")}catch(T){s=function(e,t,r){return e[t]=r}}function c(e,t,r,n){var i=t&&t.prototype instanceof l?t:l,o=Object.create(i.prototype),a=new C(n||[]);return o._invoke=function(e,t,r){var n="suspendedStart";return function(i,o){if("executing"===n)throw new Error("Generator is already running");if("completed"===n){if("throw"===i)throw o;return{value:void 0,done:!0}}for(r.method=i,r.arg=o;;){var a=r.delegate;if(a){var s=x(a,r);if(s){if(s===d)continue;return s}}if("next"===r.method)r.sent=r._sent=r.arg;else if("throw"===r.method){if("suspendedStart"===n)throw n="completed",r.arg;r.dispatchException(r.arg)}else"return"===r.method&&r.abrupt("return",r.arg);n="executing";var c=u(e,t,r);if("normal"===c.type){if(n=r.done?"completed":"suspendedYield",c.arg===d)continue;return{value:c.arg,done:r.done}}"throw"===c.type&&(n="completed",r.method="throw",r.arg=c.arg)}}}(e,r,a),o}function u(e,t,r){try{return{type:"normal",arg:e.call(t,r)}}catch(T){return{type:"throw",arg:T}}}e.wrap=c;var d={};function l(){}function f(){}function h(){}var p={};p[i]=function(){return this};var m=Object.getPrototypeOf,v=m&&m(m(O([])));v&&v!==t&&r.call(v,i)&&(p=v);var g=h.prototype=l.prototype=Object.create(p);function y(e){["next","throw","return"].forEach((function(t){s(e,t,(function(e){return this._invoke(t,e)}))}))}function b(e,t){var n;this._invoke=function(i,o){function a(){return new t((function(n,a){!function n(i,o,a,s){var c=u(e[i],e,o);if("throw"!==c.type){var d=c.arg,l=d.value;return l&&"object"===typeof l&&r.call(l,"__await")?t.resolve(l.__await).then((function(e){n("next",e,a,s)}),(function(e){n("throw",e,a,s)})):t.resolve(l).then((function(e){d.value=e,a(d)}),(function(e){return n("throw",e,a,s)}))}s(c.arg)}(i,o,n,a)}))}return n=n?n.then(a,a):a()}}function x(e,t){var r=e.iterator[t.method];if(void 0===r){if(t.delegate=null,"throw"===t.method){if(e.iterator.return&&(t.method="return",t.arg=void 0,x(e,t),"throw"===t.method))return d;t.method="throw",t.arg=new TypeError("The iterator does not provide a 'throw' method")}return d}var n=u(r,e.iterator,t.arg);if("throw"===n.type)return t.method="throw",t.arg=n.arg,t.delegate=null,d;var i=n.arg;return i?i.done?(t[e.resultName]=i.value,t.next=e.nextLoc,"return"!==t.method&&(t.method="next",t.arg=void 0),t.delegate=null,d):i:(t.method="throw",t.arg=new TypeError("iterator result is not an object"),t.delegate=null,d)}function w(e){var t={tryLoc:e[0]};1 in e&&(t.catchLoc=e[1]),2 in e&&(t.finallyLoc=e[2],t.afterLoc=e[3]),this.tryEntries.push(t)}function q(e){var t=e.completion||{};t.type="normal",delete t.arg,e.completion=t}function C(e){this.tryEntries=[{tryLoc:"root"}],e.forEach(w,this),this.reset(!0)}function O(e){if(e){var t=e[i];if(t)return t.call(e);if("function"===typeof e.next)return e;if(!isNaN(e.length)){var n=-1,o=function t(){for(;++n<e.length;)if(r.call(e,n))return t.value=e[n],t.done=!1,t;return t.value=void 0,t.done=!0,t};return o.next=o}}return{next:k}}function k(){return{value:void 0,done:!0}}return f.prototype=g.constructor=h,h.constructor=f,f.displayName=s(h,a,"GeneratorFunction"),e.isGeneratorFunction=function(e){var t="function"===typeof e&&e.constructor;return!!t&&(t===f||"GeneratorFunction"===(t.displayName||t.name))},e.mark=function(e){return Object.setPrototypeOf?Object.setPrototypeOf(e,h):(e.__proto__=h,s(e,a,"GeneratorFunction")),e.prototype=Object.create(g),e},e.awrap=function(e){return{__await:e}},y(b.prototype),b.prototype[o]=function(){return this},e.AsyncIterator=b,e.async=function(t,r,n,i,o){void 0===o&&(o=Promise);var a=new b(c(t,r,n,i),o);return e.isGeneratorFunction(r)?a:a.next().then((function(e){return e.done?e.value:a.next()}))},y(g),s(g,a,"Generator"),g[i]=function(){return this},g.toString=function(){return"[object Generator]"},e.keys=function(e){var t=[];for(var r in e)t.push(r);return t.reverse(),function r(){for(;t.length;){var n=t.pop();if(n in e)return r.value=n,r.done=!1,r}return r.done=!0,r}},e.values=O,C.prototype={constructor:C,reset:function(e){if(this.prev=0,this.next=0,this.sent=this._sent=void 0,this.done=!1,this.delegate=null,this.method="next",this.arg=void 0,this.tryEntries.forEach(q),!e)for(var t in this)"t"===t.charAt(0)&&r.call(this,t)&&!isNaN(+t.slice(1))&&(this[t]=void 0)},stop:function(){this.done=!0;var e=this.tryEntries[0].completion;if("throw"===e.type)throw e.arg;return this.rval},dispatchException:function(e){if(this.done)throw e;var t=this;function n(r,n){return a.type="throw",a.arg=e,t.next=r,n&&(t.method="next",t.arg=void 0),!!n}for(var i=this.tryEntries.length-1;i>=0;--i){var o=this.tryEntries[i],a=o.completion;if("root"===o.tryLoc)return n("end");if(o.tryLoc<=this.prev){var s=r.call(o,"catchLoc"),c=r.call(o,"finallyLoc");if(s&&c){if(this.prev<o.catchLoc)return n(o.catchLoc,!0);if(this.prev<o.finallyLoc)return n(o.finallyLoc)}else if(s){if(this.prev<o.catchLoc)return n(o.catchLoc,!0)}else{if(!c)throw new Error("try statement without catch or finally");if(this.prev<o.finallyLoc)return n(o.finallyLoc)}}}},abrupt:function(e,t){for(var n=this.tryEntries.length-1;n>=0;--n){var i=this.tryEntries[n];if(i.tryLoc<=this.prev&&r.call(i,"finallyLoc")&&this.prev<i.finallyLoc){var o=i;break}}o&&("break"===e||"continue"===e)&&o.tryLoc<=t&&t<=o.finallyLoc&&(o=null);var a=o?o.completion:{};return a.type=e,a.arg=t,o?(this.method="next",this.next=o.finallyLoc,d):this.complete(a)},complete:function(e,t){if("throw"===e.type)throw e.arg;return"break"===e.type||"continue"===e.type?this.next=e.arg:"return"===e.type?(this.rval=this.arg=e.arg,this.method="return",this.next="end"):"normal"===e.type&&t&&(this.next=t),d},finish:function(e){for(var t=this.tryEntries.length-1;t>=0;--t){var r=this.tryEntries[t];if(r.finallyLoc===e)return this.complete(r.completion,r.afterLoc),q(r),d}},catch:function(e){for(var t=this.tryEntries.length-1;t>=0;--t){var r=this.tryEntries[t];if(r.tryLoc===e){var n=r.completion;if("throw"===n.type){var i=n.arg;q(r)}return i}}throw new Error("illegal catch attempt")},delegateYield:function(e,t,r){return this.delegate={iterator:O(e),resultName:t,nextLoc:r},"next"===this.method&&(this.arg=void 0),d}},e}(e.exports);try{regeneratorRuntime=n}catch(i){Function("r","regeneratorRuntime = r")(n)}},function(e,t,r){"use strict";function n(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function i(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function o(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?i(Object(r),!0).forEach((function(t){n(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):i(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}r.r(t);var a=r(0),s=r.n(a);function c(e,t){(null==t||t>e.length)&&(t=e.length);for(var r=0,n=new Array(t);r<t;r++)n[r]=e[r];return n}function u(e,t){if(e){if("string"===typeof e)return c(e,t);var r=Object.prototype.toString.call(e).slice(8,-1);return"Object"===r&&e.constructor&&(r=e.constructor.name),"Map"===r||"Set"===r?Array.from(e):"Arguments"===r||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)?c(e,t):void 0}}function d(e,t){return function(e){if(Array.isArray(e))return e}(e)||function(e,t){if("undefined"!==typeof Symbol&&Symbol.iterator in Object(e)){var r=[],n=!0,i=!1,o=void 0;try{for(var a,s=e[Symbol.iterator]();!(n=(a=s.next()).done)&&(r.push(a.value),!t||r.length!==t);n=!0);}catch(c){i=!0,o=c}finally{try{n||null==s.return||s.return()}finally{if(i)throw o}}return r}}(e,t)||u(e,t)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function l(e,t){var r;if("undefined"===typeof Symbol||null==e[Symbol.iterator]){if(Array.isArray(e)||(r=u(e))||t&&e&&"number"===typeof e.length){r&&(e=r);var n=0,i=function(){};return{s:i,n:function(){return n>=e.length?{done:!0}:{done:!1,value:e[n++]}},e:function(e){throw e},f:i}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var o,a=!0,s=!1;return{s:function(){r=e[Symbol.iterator]()},n:function(){var e=r.next();return a=e.done,e},e:function(e){s=!0,o=e},f:function(){try{a||null==r.return||r.return()}finally{if(s)throw o}}}}let f;!function(e){e[e.Unregistered=0]="Unregistered",e[e.Registered=1]="Registered",e[e.Acquired=2]="Acquired"}(f||(f={}));const h=({courseToStatus:e,courseToRequirement:t,requirementToOthersCount:r,selectionNameToOptionName:n})=>({courseToStatus:Object.fromEntries([...e].map(([e,t])=>[e.code,t])),courseToRequirement:Object.fromEntries([...t].map(([e,t])=>[e.code,t.id])),requirementToOthersCount:Object.fromEntries([...r].map(([e,t])=>[e.id,t])),selectionNameToOptionName:Object.fromEntries(n)});new Map,new Map,new Map,new Map;class p{constructor({id:e,name:t}){this.id=void 0,this.name=void 0,this.id=e,this.name=t}getStatus(e){const t=this.getRequiredCreditCount(e.selectionNameToOptionName),r=this.getRegisteredCreditCounts(e,!1);return r.acquired>=t.min?f.Acquired:r.registered>=t.min?f.Registered:f.Unregistered}}class m extends p{constructor({id:e,name:t,description:r,children:n,creditCount:i}){super({id:e,name:t}),this.description=void 0,this.children=void 0,this.creditCount=void 0,this.description=r,this.children=[...n],this.creditCount=i}getRegisteredCreditCounts(e,t){const r=this.children.reduce((r,n)=>{const i=n.getRegisteredCreditCounts(e,t);return{acquired:r.acquired+i.acquired,registered:r.registered+i.registered}},{acquired:0,registered:0});return t||void 0===this.creditCount?r:{acquired:Math.min(this.creditCount.max,r.acquired),registered:Math.min(this.creditCount.max,r.registered)}}getRequiredCreditCount(e){return void 0===this.creditCount?this.children.reduce((t,r)=>{const n=r.getRequiredCreditCount(e);return{min:t.min+n.min,max:t.max+n.max}},{min:0,max:0}):this.creditCount}getStatus(e){return Math.min(super.getStatus(e),...this.children.map(t=>t.getStatus(e)))}getVisibleRequirements(e){return this.children.flatMap(t=>t.getVisibleRequirements(e))}toJSON(){return{name:this.name,description:this.description,children:this.children.map(e=>e.toJSON()),creditCount:this.creditCount}}}class v extends p{constructor({id:e,name:t,description:r,courses:n,creditCount:i,allowsOthers:o=!1}){super({id:e,name:t}),this.description=void 0,this.courses=void 0,this.creditCount=void 0,this.allowsOthers=void 0,this.description=r,this.courses=[...n],this.creditCount=i,this.allowsOthers=o}getRegisteredCreditCounts(e,t){const r=e.requirementToOthersCount.get(this)||{acquired:0,registered:0},n=this.courses.reduce((t,r)=>{const n=e.courseToStatus.get(r)||f.Unregistered;return e.courseToRequirement.get(r)===this?n===f.Acquired?{acquired:t.acquired+r.creditCount,registered:t.registered+r.creditCount}:n===f.Registered?{acquired:t.acquired,registered:t.registered+r.creditCount}:t:t},r);return t||void 0===this.creditCount?n:{acquired:Math.min(this.creditCount.max,n.acquired),registered:Math.min(this.creditCount.max,n.registered)}}getRequiredCreditCount(){return this.creditCount}getVisibleRequirements(){return[this]}toJSON(){return{name:this.name,description:this.description,courses:this.courses.map(e=>e.code),creditCount:this.creditCount,allowsOthers:this.allowsOthers}}}class g extends p{constructor({id:e,name:t,options:r}){super({id:e,name:t}),this.name=void 0,this.options=void 0,this.optionNameToRequirement=void 0,this.name=t;const n=[...r];this.options=n,this.optionNameToRequirement=new Map(n.map(({name:e,requirement:t})=>[e,t]))}getSelectedOptionName(e){return e.get(this.name)||this.options[0].name}getSelectedRequirement(e){const t=this.getSelectedOptionName(e);return this.optionNameToRequirement.get(t)}getRegisteredCreditCounts(e,t){const r=this.getSelectedRequirement(e.selectionNameToOptionName);return void 0===r?{acquired:0,registered:0}:r.getRegisteredCreditCounts(e,t)}getRequiredCreditCount(e){const t=this.getSelectedRequirement(e);return void 0===t?{min:0,max:0}:t.getRequiredCreditCount(e)}getVisibleRequirements(e){const t=this.getSelectedRequirement(e);return void 0===t?[]:t.getVisibleRequirements(e)}toJSON(){return{name:this.name,options:this.options.map(({name:e,requirement:t})=>({name:e,requirement:t.toJSON()}))}}}const y=e=>"number"===typeof e?{min:e,max:e}:e,b=(e,t,r)=>{var n;const i=null!==(n=r.get(e.name))&&void 0!==n?n:0;r.set(e.name,i+1);const o="".concat(e.name,"_").concat(i);if("courses"in e){const r=new v({id:o,name:e.name,description:e.description,creditCount:y(e.creditCount),courses:e.courses.map(e=>{const r=t.get(e);if(void 0===r)throw new Error("\u79d1\u76ee\u756a\u53f7 ".concat(e," \u306f\u5b9a\u7fa9\u3055\u308c\u3066\u3044\u307e\u305b\u3093\u3002"));return r}),allowsOthers:e.allowsOthers});return{requirement:r,idToRequirement:new Map([[r.id,r]])}}if("children"in e){const n=e.children.map(e=>b(e,t,r));return{requirement:new m({id:o,name:e.name,description:e.description,children:n.map(({requirement:e})=>e),creditCount:void 0===e.creditCount?void 0:y(e.creditCount)}),idToRequirement:new Map(n.flatMap(({idToRequirement:e})=>[...e.entries()]))}}{const n=e.options.map(e=>{if("requirement"in e){const n=b(e.requirement,t,r),i=n.requirement,o=n.idToRequirement;return{option:{requirement:i,name:e.name},idToRequirement:o}}{const n=b(e,t,r),i=n.requirement,o=n.idToRequirement;return{option:{requirement:i,name:i.name},idToRequirement:o}}});return{requirement:new g({id:o,name:e.name,options:n.map(({option:e})=>e)}),idToRequirement:new Map(n.flatMap(({idToRequirement:e})=>[...e.entries()]))}}};var x=s.a.mark(R),w=s.a.mark(S),q=s.a.mark(N),C=s.a.mark(E),O=s.a.mark(M),k=s.a.mark(L),T=s.a.mark(_);function R(e,t,r,n,i){var o,a,c,u,f,h,p;return s.a.wrap((function(s){for(;;)switch(s.prev=s.next){case 0:if(!(r>=e.min&&i>r-e.max)){s.next=3;break}return s.next=3,n;case 3:if(!(r<e.max)){s.next=22;break}o=l(t.entries()),s.prev=5,o.s();case 7:if((a=o.n()).done){s.next=14;break}return c=d(a.value,2),u=c[0],f=c[1],h=t.slice(u+1),p=R(e,h,r+f.creditCount,[...n,f],Math.min(i,f.creditCount)),s.delegateYield(p,"t0",12);case 12:s.next=7;break;case 14:s.next=19;break;case 16:s.prev=16,s.t1=s.catch(5),o.e(s.t1);case 19:return s.prev=19,o.f(),s.finish(19);case 22:case"end":return s.stop()}}),x,null,[[5,16,19,22]])}function S(e,t,r,n,i,o,a){var c,u,f,h,p,m,v,g,y,b,x,q,C;return s.a.wrap((function(s){for(;;)switch(s.prev=s.next){case 0:if(!(i>=e.min&&a>i-e.max||n>=e.min&&a>n-e.max)){s.next=3;break}return s.next=3,o;case 3:if(!(n<e.max)){s.next=42;break}c=l(t.entries()),s.prev=5,c.s();case 7:if((u=c.n()).done){s.next=14;break}return f=d(u.value,2),h=f[0],p=f[1],m=t.slice(h+1),v=R(e,m,n+p.creditCount,[...o,p],Math.min(a,p.creditCount)),s.delegateYield(v,"t0",12);case 12:s.next=7;break;case 14:s.next=19;break;case 16:s.prev=16,s.t1=s.catch(5),c.e(s.t1);case 19:return s.prev=19,c.f(),s.finish(19);case 22:g=l(r.entries()),s.prev=23,g.s();case 25:if((y=g.n()).done){s.next=32;break}return b=d(y.value,2),h=b[0],p=b[1],m=r.slice(h+1),v=S(e,t,m,n+p.creditCount,i+p.creditCount,[...o,p],Math.min(a,p.creditCount)),s.delegateYield(v,"t2",30);case 30:s.next=25;break;case 32:s.next=37;break;case 34:s.prev=34,s.t3=s.catch(23),g.e(s.t3);case 37:return s.prev=37,g.f(),s.finish(37);case 40:s.next=61;break;case 42:if(!(i<e.max)){s.next=61;break}x=l(r.entries()),s.prev=44,x.s();case 46:if((q=x.n()).done){s.next=53;break}return C=d(q.value,2),h=C[0],p=C[1],m=r.slice(h+1),v=R(e,m,i+p.creditCount,[...o,p],Math.min(a,p.creditCount)),s.delegateYield(v,"t4",51);case 51:s.next=46;break;case 53:s.next=58;break;case 55:s.prev=55,s.t5=s.catch(44),x.e(s.t5);case 58:return s.prev=58,x.f(),s.finish(58);case 61:case"end":return s.stop()}}),w,null,[[5,16,19,22],[23,34,37,40],[44,55,58,61]])}const j=e=>{const t=e.map(({requirement:e,generator:t})=>({requirement:e,generator:t,courseLists:[]}));for(;;){var r,n=l(t);try{for(n.s();!(r=n.n()).done;){const e=r.value,t=e.requirement,n=e.generator,i=e.courseLists,o=n.next();if(o.done)return{requirement:t,courseLists:i};i.push(o.value)}}catch(i){n.e(i)}finally{n.f()}}};function N(e,t){var r,n,i,a,c,u,d;return s.a.wrap((function(s){for(;;)switch(s.prev=s.next){case 0:if(0!==e.length){s.next=4;break}return s.next=3,t;case 3:return s.abrupt("return");case 4:r=e.map(e=>{var r,n,i,o;const a=e.courses.filter(e=>void 0===t.courseToRequirement.get(e)&&t.courseToStatus.get(e)===f.Registered),s=e.courses.filter(e=>void 0===t.courseToRequirement.get(e)&&t.courseToStatus.get(e)===f.Acquired);return{requirement:e,generator:S(e.creditCount,a,s,null!==(r=null===(n=t.requirementToOthersCount.get(e))||void 0===n?void 0:n.registered)&&void 0!==r?r:0,null!==(i=null===(o=t.requirementToOthersCount.get(e))||void 0===o?void 0:o.acquired)&&void 0!==i?i:0,[],1/0)}}),n=j(r),i=l(n.courseLists),s.prev=7,i.s();case 9:if((a=i.n()).done){s.next=16;break}return c=a.value,u=o(o({},t),{},{courseToRequirement:new Map([...t.courseToRequirement,...c.map(e=>[e,n.requirement])])}),d=N(e.filter(e=>e!==n.requirement),u),s.delegateYield(d,"t0",14);case 14:s.next=9;break;case 16:s.next=21;break;case 18:s.prev=18,s.t1=s.catch(7),i.e(s.t1);case 21:return s.prev=21,i.f(),s.finish(21);case 24:case"end":return s.stop()}}),q,null,[[7,18,21,24]])}function E(e,t){var r,n,i,a,c,u,d,f,h;return s.a.wrap((function(s){for(;;)switch(s.prev=s.next){case 0:r=e.getVisibleRequirements(t.selectionNameToOptionName),n=o(o({},t),{},{courseToRequirement:new Map}),i=void 0,a=l(N(r,n)),s.prev=4,a.s();case 6:if((c=a.n()).done){s.next=28;break}if(u=c.value,d=e.getRegisteredCreditCounts(u,!1),void 0!==i){s.next=15;break}return i={acquired:{plan:u,creditCounts:d},registered:{plan:u,creditCounts:d}},s.next=13,[u];case 13:s.next=26;break;case 15:if(f=d.acquired>i.acquired.creditCounts.acquired||d.acquired===i.acquired.creditCounts.acquired&&d.registered>i.acquired.creditCounts.registered?{plan:u,creditCounts:d}:i.acquired,h=d.registered>i.registered.creditCounts.registered||d.registered===i.registered.creditCounts.registered&&d.acquired>i.registered.creditCounts.acquired?{plan:u,creditCounts:d}:i.registered,f===i.acquired&&h===i.registered){s.next=26;break}if(i={acquired:f,registered:h},f.plan!==h.plan){s.next=24;break}return s.next=22,[u];case 22:s.next=26;break;case 24:return s.next=26,[f.plan,h.plan];case 26:s.next=6;break;case 28:s.next=33;break;case 30:s.prev=30,s.t0=s.catch(4),a.e(s.t0);case 33:return s.prev=33,a.f(),s.finish(33);case 36:case"end":return s.stop()}}),C,null,[[4,30,33,36]])}function M(e,t){var r,n,i,o,a;return s.a.wrap((function(s){for(;;)switch(s.prev=s.next){case 0:if(0!==e.length){s.next=5;break}return s.next=3,t;case 3:s.next=23;break;case 5:r=e[0],n=e.slice(1),i=l(L(r,t)),s.prev=8,i.s();case 10:if((o=i.n()).done){s.next=15;break}return a=o.value,s.delegateYield(M(n,a),"t0",13);case 13:s.next=10;break;case 15:s.next=20;break;case 17:s.prev=17,s.t1=s.catch(8),i.e(s.t1);case 20:return s.prev=20,i.f(),s.finish(20);case 23:case"end":return s.stop()}}),O,null,[[8,17,20,23]])}function L(e,t){var r,n,i,o,a;return s.a.wrap((function(s){for(;;)switch(s.prev=s.next){case 0:if(!(e instanceof g)){s.next=26;break}if(void 0!==(r=t.get(e.name))){s.next=21;break}n=l(e.options),s.prev=4,n.s();case 6:if((i=n.n()).done){s.next=11;break}return o=i.value,s.delegateYield(L(o.requirement,new Map([...t,[e.name,o.name]])),"t0",9);case 9:s.next=6;break;case 11:s.next=16;break;case 13:s.prev=13,s.t1=s.catch(4),n.e(s.t1);case 16:return s.prev=16,n.f(),s.finish(16);case 19:s.next=24;break;case 21:if(void 0===(a=e.optionNameToRequirement.get(r))){s.next=24;break}return s.delegateYield(L(a,t),"t2",24);case 24:s.next=32;break;case 26:if(!(e instanceof m)){s.next=30;break}return s.delegateYield(M(e.children,t),"t3",28);case 28:s.next=32;break;case 30:return s.next=32,t;case 32:case"end":return s.stop()}}),k,null,[[4,13,16,19]])}function _(e,t){var r,n,i,a,c,u,d,f;return s.a.wrap((function(s){for(;;)switch(s.prev=s.next){case 0:r=[],n=l(L(e,new Map)),s.prev=2,n.s();case 4:if((i=n.n()).done){s.next=28;break}a=i.value,c=[],u=l(E(e,o(o({},t),{},{selectionNameToOptionName:a}))),s.prev=8,u.s();case 10:if((d=u.n()).done){s.next=17;break}return f=d.value,c=[...r,...f],s.next=15,c;case 15:s.next=10;break;case 17:s.next=22;break;case 19:s.prev=19,s.t0=s.catch(8),u.e(s.t0);case 22:return s.prev=22,u.f(),s.finish(22);case 25:r=c;case 26:s.next=4;break;case 28:s.next=33;break;case 30:s.prev=30,s.t1=s.catch(2),n.e(s.t1);case 33:return s.prev=33,n.f(),s.finish(33);case 36:case"end":return s.stop()}}),T,null,[[2,30,33,36],[8,19,22,25]])}globalThis.addEventListener("message",e=>{const t=e.data,r=t.requirementJSON,n=t.planJSON,i=t.codeToCourse,o=((e,t)=>b(e,t,new Map))(r,i);var a,s=l(_(o.requirement,((e,{codeToCourse:t,idToRequirement:r})=>({courseToStatus:new Map(Object.entries(e.courseToStatus).map(([e,r])=>{const n=t.get(e);if(void 0===n)throw new Error;return[n,r]})),courseToRequirement:new Map(Object.entries(e.courseToRequirement).map(([e,n])=>{const i=t.get(e),o=r.get(n);if(void 0===i)throw new Error;if(void 0===o)throw new Error;return[i,o]})),requirementToOthersCount:new Map(Object.entries(e.requirementToOthersCount).map(([e,t])=>{const n=r.get(e);if(void 0===n)throw new Error;return[n,t]})),selectionNameToOptionName:new Map(Object.entries(e.selectionNameToOptionName))}))(n,{codeToCourse:i,idToRequirement:o.idToRequirement})));try{for(s.s();!(a=s.n()).done;){const e=a.value;postMessage(e.map(h))}}catch(c){s.e(c)}finally{s.f()}postMessage("done")})}]);