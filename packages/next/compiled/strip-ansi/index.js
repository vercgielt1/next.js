module.exports=(()=>{"use strict";var e={308:(e,r,_)=>{_.r(r);_.d(r,{default:()=>stripAnsi});function ansiRegex({onlyFirst:e=false}={}){const r=["[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)","(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))"].join("|");return new RegExp(r,e?undefined:"g")}function stripAnsi(e){if(typeof e!=="string"){throw new TypeError(`Expected a \`string\`, got \`${typeof e}\``)}return e.replace(ansiRegex(),"")}}};var r={};function __nccwpck_require__(_){if(r[_]){return r[_].exports}var t=r[_]={exports:{}};var i=true;try{e[_](t,t.exports,__nccwpck_require__);i=false}finally{if(i)delete r[_]}return t.exports}(()=>{__nccwpck_require__.d=((e,r)=>{for(var _ in r){if(__nccwpck_require__.o(r,_)&&!__nccwpck_require__.o(e,_)){Object.defineProperty(e,_,{enumerable:true,get:r[_]})}}})})();(()=>{__nccwpck_require__.o=((e,r)=>Object.prototype.hasOwnProperty.call(e,r))})();(()=>{__nccwpck_require__.r=(e=>{if(typeof Symbol!=="undefined"&&Symbol.toStringTag){Object.defineProperty(e,Symbol.toStringTag,{value:"Module"})}Object.defineProperty(e,"__esModule",{value:true})})})();__nccwpck_require__.ab=__dirname+"/";return __nccwpck_require__(308)})();