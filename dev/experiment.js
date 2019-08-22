import demographicsQuestions from "./demographics.js";
import PORT from "./port.js";

const FULLSCREEN = false;

export function getTrials(workerId='NA', assignmentId='NA', hitId='NA', dev, reset, numTrials) {
  
  $("#loading").html('Loading trials... please wait. </br> <img src="img/preloader.gif">')
  
  // This calls server to run python generate trials (judements.py) script
  // Then passes the generated trials to the experiment
  $.ajax({
      url: 'http://'+document.domain+':'+PORT+'/trials',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({workerId: workerId,image_file: 'rensink_wolfe_images_newformat.csv', dev, reset, numTrials }),
      success: function (data) {
          console.log(data);
          $("#loading").remove();
          runExperiment(data.trials, workerId, assignmentId, hitId, PORT, FULLSCREEN);
      }
  })
}

function disableScrollOnSpacebarPress () {
  window.onkeydown = function(e) {
    if (e.keyCode == 32 && e.target == document.body) {
      e.preventDefault();
    }
  };
}

// Function Call to Run the experiment
function runExperiment(trials, workerId, assignmentId, hitId, PORT, FULLSCREEN) {
  disableScrollOnSpacebarPress();

  let timeline = [];

  // Data that is collected for jsPsych
  let turkInfo = jsPsych.turk.turkInfo();
  let participantID = makeid() + "iTi" + makeid();

  jsPsych.data.addProperties({
    subject: participantID,
    condition: "explicit",
    group: "shuffled",
    assginementId: assignmentId,
    hitId: hitId
  });

  // sample function that might be used to check if a subject has given
  // consent to participate.
  var check_consent = function (elem) {
    if ($('#consent_checkbox').is(':checked')) {
        return true;
    }
    else {
        alert("If you wish to participate, you must check the box next to the statement 'I agree to participate in this study.'");
        return false;
    }
    return false;
  };
   // declare the block.
   var consent = {
     type: 'external-html',
     url: "./consent_mturk.html",
     cont_btn: "start",
     check_fn: check_consent
   };

   timeline.push(consent);

  let continue_space =
    "<div class='right small'>Press SPACE to begin.</div>";

  let instructions = {
    type: "instructions",
    key_forward: 'space',
    key_backward: 'backspace',
//    pages: [
//		`<p>In your browser, you will see an image of several objects in a circle and the image will appear to blink.</p> 
//		<p>Somewhere in circle of objects, something will change (e.g. an object change to a different object, change color, move, or disappear entirely).</p>
//		<p>	Your task is to try to see what changes as fast as you can. </p>
//		<p><b>As soon as you spot the change, press the spacebar.</b>. <p>
//		<p>You will then be asked to use the mouse to <b>click on the image to indicate what changed.</b> You will have about a minute to find the change, and after that, make your best guess by clicking somewhere on the picture.
//		</p> ${continue_space}`
//    ]
      pages: [
    `<p>In your browser, you will see an image of a scene that appears to blink.</p> 
    <p>Somewhere in the scene, something will change (e.g. an object change to a different object, change color, move, or disappear entirely).</p>
    <p>	Your task is to try to see what changes as fast as you can. </p>
    <p><b>As soon as you spot the change, press the spacebar.</b>. <p>
    <p>You will then be asked to use the mouse to <b>click on the image to indicate what changed.</b> You will have about a minute to find the change, and after that, make your best guess by clicking somewhere on the picture.
    </p> ${continue_space}`
    ]
  };

  timeline.push(instructions);

  // keeps track of current trial progression
  // and used for the progress bar
  let progress_number = 1;
  let images = [];
  let num_trials = trials.length;

  trials.forEach((trial, index) => {
    // In contrast to progress_number,
    // trial_number is used for recording
    // responses
    const trial_number = index + 1;
      
    images.push('http://'+document.domain+':'+PORT+'/' + trial.image + "/" + trial.unmodified_image + '.jpg');
    images.push('http://'+document.domain+':'+PORT+'/' + trial.image + "/" + trial.modified_image + '.jpg');

    // Empty Response Data to be sent to be collected
    let response = {
      workerId: workerId,
      assignmentId: assignmentId,
      hitId: hitId,
      set: trial.set,
      unmod_image: trial.unmodified_image,
      mod_image: trial.modified_image,
      expTimer: -1,
      response: -1,
      trial_number: trial_number,
      rt: -1
    };
    
    const unmod_image = trial.unmodified_image;
    const mod_image = trial.modified_image;
    
    let stimulus = /*html*/`
        <h5 style="text-align:center;margin-top:0;">Trial ${trial_number} of ${num_trials}</h5>
    `;
    
    // Picture Trial
    let jsPsychTrial = {
      type: "change-detection",

      stimulus: stimulus,
      unmodified_image: 'http://'+document.domain+':'+PORT+'/' + trial.image + "/" +`${unmod_image}.jpg`,
      modified_image: 'http://'+document.domain+':'+PORT+'/' + trial.image + "/" +`${mod_image}.jpg`,
      image_interval_duration: 240,
      white_screen_interval_duration: 0,
      initial_white_screen_duration: 1000,
      initial_fixation_duration: 3000,
      timeout: 60000,

      on_finish: function(data) {
        // response.response = String.fromCharCode(data.key_press);
        // response.choice = choices[Number(response.response)-1];
        response.x = data.x;
        response.y = data.y;
        response.rt = data.rt;
        response.expTimer = data.time_elapsed / 1000;

        // POST response data to server
        $.ajax({
          url: "http://" + document.domain + ":" + PORT + "/data",
          type: "POST",
          contentType: "application/json",
          data: JSON.stringify(response),
          success: function() {
            console.log(response);
            jsPsych.setProgressBar((progress_number - 1) / num_trials);
            progress_number++;
          }
        });
      }
    };
    timeline.push(jsPsychTrial);
  });


  let questionsInstructions = {
    type: "instructions",
    key_forward: 'space',
    key_backward: 'backspace',
    pages: [
        `<p class="lead">We'll now ask you a few demographic questions and we'll be done!
          </p> ${continue_space}`,
    ]
  };

  timeline.push(questionsInstructions);

  let demographicsTrial = {
      type: 'surveyjs',
      questions: demographicsQuestions,
      on_finish: function (data) {
          let demographicsResponses = data.response;
          console.log(demographicsResponses);
          let demographics = Object.assign({ workerId }, demographicsResponses);
          // POST demographics data to server
          $.ajax({
              url: 'http://' + document.domain + ':' + PORT + '/demographics',
              type: 'POST',
              contentType: 'application/json',
              data: JSON.stringify(demographics),
              success: function () {
              }
          })

  let endmessage = `Thank you for participating! Your completion code is ${participantID}. Copy and paste this in
        MTurk to receive payment for the HIT. 

    <p>
        If you have any questions or comments, please email ejward@wisc.edu.`;
          jsPsych.endExperiment(endmessage);
      }
  };
    
    
  timeline.push(demographicsTrial);

  let endmessage = `Thank you for participating! Your completion code is ${participantID}. Copy and paste this in
        MTurk to receive payment for the HIT. 
<p>
        If you have any questions or comments, please email ejward@wisc.edu.`;

    
  Promise.all(images.map((image, index) => {
    return loadImage(image)
    .catch((error) => {
      console.warn("Removing trial with image, " + image);
      trials[index] = null;
    });
  }))
  .then((images) => {
    trials = trials.filter((trial, index) => {
      return trial !== null;
    });
    startExperiment();
  })

  function startExperiment() {
    jsPsych.init({
      timeline: timeline,
      fullscreen: FULLSCREEN,
      show_progress_bar: true,
      auto_update_progress_bar: false,
    });
  }
}
