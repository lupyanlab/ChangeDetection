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
      unmodified_image: {
        type: jsPsych.plugins.parameterType.IMAGE, // INT, IMAGE, KEYCODE, STRING, FUNCTION, FLOAT
        default_value: undefined
      },
      modified_image: {
        type: jsPsych.plugins.parameterType.IMAGE,
        default_value: undefined
      },
      timeout: {
        type: jsPsych.plugins.parameterType.INT,
        default_value: undefined
      },
      interval_duration: {
        type: jsPsych.plugins.parameterType.INT,
        default_value: undefined
      },
    }
  };

  plugin.trial = function(display_element, trial) {
    display_element.innerHTML = /*html*/ `
    ${trial.stimulus}
    <div style="display:flex;justify-content:space-between;flex-direction:column;">
      <h4 id="image-title">Unmodified</h4>
      <img id="image" src="${trial.unmodified_image}" alt="${trial.unmodified_image}" style="width:100%;height:100%;" ondragstart="return false;" />   
    </div>`;

    const imageTitleElem = document.getElementById('image-title');
    const imageElem = document.getElementById('image');
    let modified = false;

    const imageInterval = window.setInterval(() => {
      modified = !modified;
      imageElem.setAttribute('src', modified ? trial.modified_image : trial.unmodified_image);
      imageTitleElem.innerHTML = modified ? 'Modified' : 'Unmodified';
    }, trial.interval_duration);

    const goToClickOnChangeStep = () => {
      window.clearInterval(imageInterval);
      imageElem.setAttribute('src', trial.unmodified_image);
      imageTitleElem.innerHTML = 'Click on the change.'
      imageElem.addEventListener('click', (e) => {
        alert(`clicked on picture\nx: ${e.offsetX}, y: ${e.offsetY}`);
        jsPsych.finishTrial(trial_data);
      });
    };

    window.setTimeout(() => {
      goToClickOnChangeStep();
    }, trial.timeout);

    const handleSpacePress = () => {
      goToClickOnChangeStep();
    };

    const keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
      callback_function: handleSpacePress,
      valid_responses: ['space'],
      rt_method: 'date',
      persist: false,
      allow_held_key: false
    });

    var trial_data = {
      parameter_name: "parameter value"
    };
  };

  return plugin;
})();
