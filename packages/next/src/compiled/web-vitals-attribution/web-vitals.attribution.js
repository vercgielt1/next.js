(function(){"use strict";var t={};!function(){t.d=function(g,b){for(var C in b){if(t.o(b,C)&&!t.o(g,C)){Object.defineProperty(g,C,{enumerable:true,get:b[C]})}}}}();!function(){t.o=function(t,g){return Object.prototype.hasOwnProperty.call(t,g)}}();!function(){t.r=function(t){if(typeof Symbol!=="undefined"&&Symbol.toStringTag){Object.defineProperty(t,Symbol.toStringTag,{value:"Module"})}Object.defineProperty(t,"__esModule",{value:true})}}();if(typeof t!=="undefined")t.ab=__dirname+"/";var g={};t.r(g);t.d(g,{onCLS:function(){return w},onFCP:function(){return L},onFID:function(){return D},onINP:function(){return J},onLCP:function(){return Q},onTTFB:function(){return Y}});var b,C,F,P,A,a=function(){return window.performance&&performance.getEntriesByType&&performance.getEntriesByType("navigation")[0]},o=function(t){if("loading"===document.readyState)return"loading";var g=a();if(g){if(t<g.domInteractive)return"loading";if(0===g.domContentLoadedEventStart||t<g.domContentLoadedEventStart)return"dom-interactive";if(0===g.domComplete||t<g.domComplete)return"dom-content-loaded"}return"complete"},u=function(t){var g=t.nodeName;return 1===t.nodeType?g.toLowerCase():g.toUpperCase().replace(/^#/,"")},c=function(t,g){var b="";try{for(;t&&9!==t.nodeType;){var C=t,F=C.id?"#"+C.id:u(C)+(C.className&&C.className.length?"."+C.className.replace(/\s+/g,"."):"");if(b.length+F.length>(g||100)-1)return b||F;if(b=b?F+">"+b:F,C.id)break;t=C.parentNode}}catch(t){}return b},N=-1,f=function(){return N},l=function(t){addEventListener("pageshow",(function(g){g.persisted&&(N=g.timeStamp,t(g))}),!0)},d=function(){var t=a();return t&&t.activationStart||0},m=function(t,g){var b=a(),C="navigate";return f()>=0?C="back-forward-cache":b&&(C=document.prerendering||d()>0?"prerender":b.type.replace(/_/g,"-")),{name:t,value:void 0===g?-1:g,rating:"good",delta:0,entries:[],id:"v3-".concat(Date.now(),"-").concat(Math.floor(8999999999999*Math.random())+1e12),navigationType:C}},v=function(t,g,b){try{if(PerformanceObserver.supportedEntryTypes.includes(t)){var C=new PerformanceObserver((function(t){g(t.getEntries())}));return C.observe(Object.assign({type:t,buffered:!0},b||{})),C}}catch(t){}},p=function(t,g){var b=function n(b){"pagehide"!==b.type&&"hidden"!==document.visibilityState||(t(b),g&&(removeEventListener("visibilitychange",n,!0),removeEventListener("pagehide",n,!0)))};addEventListener("visibilitychange",b,!0),addEventListener("pagehide",b,!0)},h=function(t,g,b,C){var F,P;return function(A){g.value>=0&&(A||C)&&((P=g.value-(F||0))||void 0===F)&&(F=g.value,g.delta=P,g.rating=function(t,g){return t>g[1]?"poor":t>g[0]?"needs-improvement":"good"}(g.value,b),t(g))}},q=-1,T=function(){return"hidden"!==document.visibilityState||document.prerendering?1/0:0},y=function(){p((function(t){var g=t.timeStamp;q=g}),!0)},E=function(){return q<0&&(q=T(),y(),l((function(){setTimeout((function(){q=T(),y()}),0)}))),{get firstHiddenTime(){return q}}},S=function(t,g){g=g||{};var b,C=[1800,3e3],F=E(),P=m("FCP"),o=function(t){t.forEach((function(t){"first-contentful-paint"===t.name&&(N&&N.disconnect(),t.startTime<F.firstHiddenTime&&(P.value=t.startTime-d(),P.entries.push(t),b(!0)))}))},A=window.performance&&window.performance.getEntriesByName&&window.performance.getEntriesByName("first-contentful-paint")[0],N=A?null:v("paint",o);(A||N)&&(b=h(t,P,C,g.reportAllChanges),A&&o([A]),l((function(F){P=m("FCP"),b=h(t,P,C,g.reportAllChanges),requestAnimationFrame((function(){requestAnimationFrame((function(){P.value=performance.now()-F.timeStamp,b(!0)}))}))})))},j=!1,_=-1,w=function(t,g){!function(t,g){g=g||{};var b=[.1,.25];j||(S((function(t){_=t.value})),j=!0);var C,i=function(g){_>-1&&t(g)},F=m("CLS",0),P=0,A=[],c=function(t){t.forEach((function(t){if(!t.hadRecentInput){var g=A[0],b=A[A.length-1];P&&t.startTime-b.startTime<1e3&&t.startTime-g.startTime<5e3?(P+=t.value,A.push(t)):(P=t.value,A=[t]),P>F.value&&(F.value=P,F.entries=A,C())}}))},N=v("layout-shift",c);N&&(C=h(i,F,b,g.reportAllChanges),p((function(){c(N.takeRecords()),C(!0)})),l((function(){P=0,_=-1,F=m("CLS",0),C=h(i,F,b,g.reportAllChanges)})))}((function(g){!function(t){if(t.entries.length){var g=t.entries.reduce((function(t,g){return t&&t.value>g.value?t:g}));if(g&&g.sources&&g.sources.length){var b=(C=g.sources).find((function(t){return t.node&&1===t.node.nodeType}))||C[0];b&&(t.attribution={largestShiftTarget:c(b.node),largestShiftTime:g.startTime,largestShiftValue:g.value,largestShiftSource:b,largestShiftEntry:g,loadState:o(g.startTime)})}}else t.attribution={};var C}(g),t(g)}),g)},L=function(t,g){S((function(g){!function(t){if(t.entries.length){var g=a(),b=t.entries[t.entries.length-1];if(g){var C=g.activationStart||0,F=Math.max(0,g.responseStart-C);t.attribution={timeToFirstByte:F,firstByteToFCP:t.value-F,loadState:o(t.entries[0].startTime),navigationEntry:g,fcpEntry:b}}}else t.attribution={timeToFirstByte:0,firstByteToFCP:t.value,loadState:o(f())}}(g),t(g)}),g)},V={passive:!0,capture:!0},K=new Date,M=function(t,g){b||(b=g,C=t,F=new Date,I(removeEventListener),B())},B=function(){if(C>=0&&C<F-K){var t={entryType:"first-input",name:b.type,target:b.target,cancelable:b.cancelable,startTime:b.timeStamp,processingStart:b.timeStamp+C};P.forEach((function(g){g(t)})),P=[]}},x=function(t){if(t.cancelable){var g=(t.timeStamp>1e12?new Date:performance.now())-t.timeStamp;"pointerdown"==t.type?function(t,g){var n=function(){M(t,g),i()},r=function(){i()},i=function(){removeEventListener("pointerup",n,V),removeEventListener("pointercancel",r,V)};addEventListener("pointerup",n,V),addEventListener("pointercancel",r,V)}(g,t):M(g,t)}},I=function(t){["mousedown","keydown","touchstart","pointerdown"].forEach((function(g){return t(g,x,V)}))},k=function(t,g){g=g||{};var F,A=[100,300],N=E(),q=m("FID"),s=function(t){t.startTime<N.firstHiddenTime&&(q.value=t.processingStart-t.startTime,q.entries.push(t),F(!0))},f=function(t){t.forEach(s)},j=v("first-input",f);F=h(t,q,A,g.reportAllChanges),j&&p((function(){f(j.takeRecords()),j.disconnect()}),!0),j&&l((function(){var N;q=m("FID"),F=h(t,q,A,g.reportAllChanges),P=[],C=-1,b=null,I(addEventListener),N=s,P.push(N),B()}))},D=function(t,g){k((function(g){!function(t){var g=t.entries[0];t.attribution={eventTarget:c(g.target),eventType:g.name,eventTime:g.startTime,eventEntry:g,loadState:o(g.startTime)}}(g),t(g)}),g)},W=0,Z=1/0,$=0,R=function(t){t.forEach((function(t){t.interactionId&&(Z=Math.min(Z,t.interactionId),$=Math.max($,t.interactionId),W=$?($-Z)/7+1:0)}))},H=function(){return A?W:performance.interactionCount||0},O=function(){"interactionCount"in performance||A||(A=v("event",R,{type:"event",buffered:!0,durationThreshold:0}))},ee=0,U=function(){return H()-ee},te=[],ne={},z=function(t){var g=te[te.length-1],b=ne[t.interactionId];if(b||te.length<10||t.duration>g.latency){if(b)b.entries.push(t),b.latency=Math.max(b.latency,t.duration);else{var C={id:t.interactionId,latency:t.duration,entries:[t]};ne[C.id]=C,te.push(C)}te.sort((function(t,g){return g.latency-t.latency})),te.splice(10).forEach((function(t){delete ne[t.id]}))}},G=function(t,g){g=g||{};var b=[200,500];O();var C,F=m("INP"),a=function(t){t.forEach((function(t){(t.interactionId&&z(t),"first-input"===t.entryType)&&(!te.some((function(g){return g.entries.some((function(g){return t.duration===g.duration&&t.startTime===g.startTime}))}))&&z(t))}));var g,b=(g=Math.min(te.length-1,Math.floor(U()/50)),te[g]);b&&b.latency!==F.value&&(F.value=b.latency,F.entries=b.entries,C())},P=v("event",a,{durationThreshold:g.durationThreshold||40});C=h(t,F,b,g.reportAllChanges),P&&(P.observe({type:"first-input",buffered:!0}),p((function(){a(P.takeRecords()),F.value<0&&U()>0&&(F.value=0,F.entries=[]),C(!0)})),l((function(){te=[],ee=H(),F=m("INP"),C=h(t,F,b,g.reportAllChanges)})))},J=function(t,g){G((function(g){!function(t){if(t.entries.length){var g=t.entries.sort((function(t,g){return g.duration-t.duration||g.processingEnd-g.processingStart-(t.processingEnd-t.processingStart)}))[0];t.attribution={eventTarget:c(g.target),eventType:g.name,eventTime:g.startTime,eventEntry:g,loadState:o(g.startTime)}}else t.attribution={}}(g),t(g)}),g)},re={},Q=function(t,g){!function(t,g){g=g||{};var b,C=[2500,4e3],F=E(),P=m("LCP"),o=function(t){var g=t[t.length-1];if(g){var C=g.startTime-d();C<F.firstHiddenTime&&(P.value=C,P.entries=[g],b())}},A=v("largest-contentful-paint",o);if(A){b=h(t,P,C,g.reportAllChanges);var c=function(){re[P.id]||(o(A.takeRecords()),A.disconnect(),re[P.id]=!0,b(!0))};["keydown","click"].forEach((function(t){addEventListener(t,c,{once:!0,capture:!0})})),p(c,!0),l((function(F){P=m("LCP"),b=h(t,P,C,g.reportAllChanges),requestAnimationFrame((function(){requestAnimationFrame((function(){P.value=performance.now()-F.timeStamp,re[P.id]=!0,b(!0)}))}))}))}}((function(g){!function(t){if(t.entries.length){var g=a();if(g){var b=g.activationStart||0,C=t.entries[t.entries.length-1],F=C.url&&performance.getEntriesByType("resource").filter((function(t){return t.name===C.url}))[0],P=Math.max(0,g.responseStart-b),A=Math.max(P,F?(F.requestStart||F.startTime)-b:0),N=Math.max(A,F?F.responseEnd-b:0),q=Math.max(N,C?C.startTime-b:0),j={element:c(C.element),timeToFirstByte:P,resourceLoadDelay:A-P,resourceLoadTime:N-A,elementRenderDelay:q-N,navigationEntry:g,lcpEntry:C};C.url&&(j.url=C.url),F&&(j.lcpResourceEntry=F),t.attribution=j}}else t.attribution={timeToFirstByte:0,resourceLoadDelay:0,resourceLoadTime:0,elementRenderDelay:t.value}}(g),t(g)}),g)},ie=function e(t){document.prerendering?addEventListener("prerenderingchange",(function(){return e(t)}),!0):"complete"!==document.readyState?addEventListener("load",(function(){return e(t)}),!0):setTimeout(t,0)},X=function(t,g){g=g||{};var b=[800,1800],C=m("TTFB"),F=h(t,C,b,g.reportAllChanges);ie((function(){var P=a();if(P){if(C.value=Math.max(P.responseStart-d(),0),C.value<0||C.value>performance.now())return;C.entries=[P],F(!0),l((function(){C=m("TTFB",0),(F=h(t,C,b,g.reportAllChanges))(!0)}))}}))},Y=function(t,g){X((function(g){!function(t){if(t.entries.length){var g=t.entries[0],b=g.activationStart||0,C=Math.max(g.domainLookupStart-b,0),F=Math.max(g.connectStart-b,0),P=Math.max(g.requestStart-b,0);t.attribution={waitingTime:C,dnsTime:F-C,connectionTime:P-F,requestTime:t.value-P,navigationEntry:g}}else t.attribution={waitingTime:0,dnsTime:0,connectionTime:0,requestTime:0}}(g),t(g)}),g)};module.exports=g})();