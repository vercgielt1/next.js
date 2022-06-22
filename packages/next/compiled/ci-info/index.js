(()=>{"use strict";var n={653:(n,e,a)=>{var t=a(107);var r=process.env;Object.defineProperty(e,"_vendors",{value:t.map((function(n){return n.constant}))});e.name=null;e.isPR=null;t.forEach((function(n){var a=Array.isArray(n.env)?n.env:[n.env];var t=a.every((function(n){return checkEnv(n)}));e[n.constant]=t;if(t){e.name=n.name;switch(typeof n.pr){case"string":e.isPR=!!r[n.pr];break;case"object":if("env"in n.pr){e.isPR=n.pr.env in r&&r[n.pr.env]!==n.pr.ne}else if("any"in n.pr){e.isPR=n.pr.any.some((function(n){return!!r[n]}))}else{e.isPR=checkEnv(n.pr)}break;default:e.isPR=null}}}));e.isCI=!!(r.CI||r.CONTINUOUS_INTEGRATION||r.BUILD_NUMBER||r.RUN_ID||e.name||false);function checkEnv(n){if(typeof n==="string")return!!r[n];return Object.keys(n).every((function(e){return r[e]===n[e]}))}},107:n=>{n.exports=JSON.parse('[{"name":"AppVeyor","constant":"APPVEYOR","env":"APPVEYOR","pr":"APPVEYOR_PULL_REQUEST_NUMBER"},{"name":"Azure Pipelines","constant":"AZURE_PIPELINES","env":"SYSTEM_TEAMFOUNDATIONCOLLECTIONURI","pr":"SYSTEM_PULLREQUEST_PULLREQUESTID"},{"name":"Bamboo","constant":"BAMBOO","env":"bamboo_planKey"},{"name":"Bitbucket Pipelines","constant":"BITBUCKET","env":"BITBUCKET_COMMIT","pr":"BITBUCKET_PR_ID"},{"name":"Bitrise","constant":"BITRISE","env":"BITRISE_IO","pr":"BITRISE_PULL_REQUEST"},{"name":"Buddy","constant":"BUDDY","env":"BUDDY_WORKSPACE_ID","pr":"BUDDY_EXECUTION_PULL_REQUEST_ID"},{"name":"Buildkite","constant":"BUILDKITE","env":"BUILDKITE","pr":{"env":"BUILDKITE_PULL_REQUEST","ne":"false"}},{"name":"CircleCI","constant":"CIRCLE","env":"CIRCLECI","pr":"CIRCLE_PULL_REQUEST"},{"name":"Cirrus CI","constant":"CIRRUS","env":"CIRRUS_CI","pr":"CIRRUS_PR"},{"name":"AWS CodeBuild","constant":"CODEBUILD","env":"CODEBUILD_BUILD_ARN"},{"name":"Codeship","constant":"CODESHIP","env":{"CI_NAME":"codeship"}},{"name":"Drone","constant":"DRONE","env":"DRONE","pr":{"DRONE_BUILD_EVENT":"pull_request"}},{"name":"dsari","constant":"DSARI","env":"DSARI"},{"name":"GitHub Actions","constant":"GITHUB_ACTIONS","env":"GITHUB_ACTIONS","pr":{"GITHUB_EVENT_NAME":"pull_request"}},{"name":"GitLab CI","constant":"GITLAB","env":"GITLAB_CI"},{"name":"GoCD","constant":"GOCD","env":"GO_PIPELINE_LABEL"},{"name":"Hudson","constant":"HUDSON","env":"HUDSON_URL"},{"name":"Jenkins","constant":"JENKINS","env":["JENKINS_URL","BUILD_ID"],"pr":{"any":["ghprbPullId","CHANGE_ID"]}},{"name":"ZEIT Now","constant":"ZEIT_NOW","env":"NOW_BUILDER"},{"name":"Magnum CI","constant":"MAGNUM","env":"MAGNUM"},{"name":"Netlify CI","constant":"NETLIFY","env":"NETLIFY","pr":{"env":"PULL_REQUEST","ne":"false"}},{"name":"Nevercode","constant":"NEVERCODE","env":"NEVERCODE","pr":{"env":"NEVERCODE_PULL_REQUEST","ne":"false"}},{"name":"Render","constant":"RENDER","env":"RENDER","pr":{"IS_PULL_REQUEST":"true"}},{"name":"Sail CI","constant":"SAIL","env":"SAILCI","pr":"SAIL_PULL_REQUEST_NUMBER"},{"name":"Semaphore","constant":"SEMAPHORE","env":"SEMAPHORE","pr":"PULL_REQUEST_NUMBER"},{"name":"Shippable","constant":"SHIPPABLE","env":"SHIPPABLE","pr":{"IS_PULL_REQUEST":"true"}},{"name":"Solano CI","constant":"SOLANO","env":"TDDIUM","pr":"TDDIUM_PR_ID"},{"name":"Strider CD","constant":"STRIDER","env":"STRIDER"},{"name":"TaskCluster","constant":"TASKCLUSTER","env":["TASK_ID","RUN_ID"]},{"name":"TeamCity","constant":"TEAMCITY","env":"TEAMCITY_VERSION"},{"name":"Travis CI","constant":"TRAVIS","env":"TRAVIS","pr":{"env":"TRAVIS_PULL_REQUEST","ne":"false"}}]')}};var e={};function __nccwpck_require__(a){var t=e[a];if(t!==undefined){return t.exports}var r=e[a]={exports:{}};var E=true;try{n[a](r,r.exports,__nccwpck_require__);E=false}finally{if(E)delete e[a]}return r.exports}if(typeof __nccwpck_require__!=="undefined")__nccwpck_require__.ab=__dirname+"/";var a=__nccwpck_require__(653);module.exports=a})();