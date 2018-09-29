/*
 * Example plugin template
 */

jsPsych.plugins["change-detection"] = (function() {
  var plugin = {};

  plugin.info = {
    name: "change-detection",
    parameters: {
      stimulus: {
        type: jsPsych.plugins.parameterType.STRING,
        default_value: ''
      },
      left_image: {
        type: jsPsych.plugins.parameterType.IMAGE, // INT, IMAGE, KEYCODE, STRING, FUNCTION, FLOAT
        default_value: undefined
      },
      right_image: {
        type: jsPsych.plugins.parameterType.IMAGE,
        default_value: undefined
      }
    }
  };

  plugin.trial = function(display_element, trial) {
    display_element.innerHTML = /*html*/ `
    ${trial.stimulus}
    <div style="display:flex;justify-content:space-between">
      <img id="left-image" src="images/${trial.left_image}" alt="${trial.left_image}" style="width:49%;height:49%;" />   
      <img id="right-image" src="images/${trial.right_image}" alt="${trial.right_image}" style="width:49%;height:49%;" />   
    </div>`;

    display_element.querySelector('#left-image').addEventListener('click', (e) => {
      alert(`clicked left picture\nx: ${e.offsetX}, y: ${e.offsetY}`);
    });

    display_element.querySelector('#right-image').addEventListener('click', (e) => {
      alert(`clicked right picture\nx: ${e.offsetX}, y: ${e.offsetY}`);
    })

    // data saving
    var trial_data = {
      parameter_name: "parameter value"
    };

    // end trial
  };

  return plugin;
})();
