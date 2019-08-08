import { getTrials } from "./experiment.js";

$(document).ready(function(){
    let workerId = $.urlParam('workerId') || 'unknown';
    let assignmentId = undefined;
    let hitId = undefined;
    let reset = $.urlParam("newSet") || "false";

    getTrials(workerId, assignmentId, hitId, false, reset);    
});
