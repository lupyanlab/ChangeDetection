import { getTrials } from "./experiment.js";

$(document).ready(function() {
  $("form").submit(function() {
      let workerId = $("#workerId").val().slice();
      let assignmentId = undefined;
      let hitId = undefined;
      let reset = $("#reset").val();
      const numTrials = $("#numTrials").val();

      $("form").remove();
      getTrials(workerId, assignmentId, hitId, true, reset, numTrials);
  });
});
