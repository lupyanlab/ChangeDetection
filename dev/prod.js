import { getTrials } from "./experiment.js";

$(document).ready(function(){
    let workerId = $.urlParam('workerId') || 'unknown';
    let setnum = $.urlParam('setnum') || 'NA';
    let assignmentId = undefined;
    let hitId = undefined;
    getTrials(workerId, assignmentId, hitId, setnum);    
});
