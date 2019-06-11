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
      image_interval_duration: {
        type: jsPsych.plugins.parameterType.INT,
        default_value: undefined
      },
      white_screen_interval_duration: {
        type: jsPsych.plugins.parameterType.INT,
        default_value: undefined
      },
      initial_white_screen_duration: {
        type: jsPsych.plugins.parameterType.INT,
        default_value: undefined
      },
      initial_fixation_duration: {
        type: jsPsych.plugins.parameterType.INT,
        default_value: undefined
      },
    }
  };

  plugin.trial = function(display_element, trial) {
    display_element.innerHTML = /*html*/ `
    ${trial.stimulus}
    <div style="display:flex;justify-content:space-between;flex-direction:column;">
      <h4 id="image-title">...</h4>
      <div id="crosshair" style="width:1024px;height:768px;display:flex;justify-content: center;align-items: center;border: dashed;">
        <div class="crosshair-container" style="position: relative;height: 5em;width: 5em;">
          <div class="crosshair-vertical" style="position: absolute;height: 100%;width: 10%;left: 45%;background-color: black;"></div>
          <div class="crosshair-horizantal" style="position: absolute;height: 10%;width: 100%;top: 45%;background-color: black;"></div>
        </div>
      </div>
      <img id="image" src="${trial.modified_image}" alt="image-stim" style="width:1024px;height:768px;display:none;" ondragstart="return false;" />   
    </div>`;

    const imageTitleElem = document.getElementById('image-title');
    const imageElem = document.getElementById('image');
    const crosshairElem = document.getElementById('crosshair');
    let modified = true;
    let switchingImages = false;
    
    let imageTimeout;

    const showWhiteScreen = () => {
      imageElem.style.display = 'none';
      imageTimeout = window.setTimeout(switchImage, trial.white_screen_interval_duration);
    };

    const switchImage = () => {
      switchingImages = true;
      imageElem.style.display = '';
      modified = !modified;
      imageElem.setAttribute('src', modified ? trial.modified_image : trial.unmodified_image);
      imageTimeout = window.setTimeout(showWhiteScreen, trial.image_interval_duration);
    };

    imageTimeout = window.setTimeout(() => {
      crosshairElem.style.display = 'none';
      imageTimeout = window.setTimeout(switchImage, trial.initial_white_screen_duration);
    }, trial.initial_fixation_duration);

    const goToClickOnChangeStep = () => {
      window.clearTimeout(imageTimeout);
      crosshairElem.style.display = 'none';
      imageElem.style.display = '';
      imageElem.setAttribute('src', trial.unmodified_image);
      imageTitleElem.innerHTML = 'Click on what changed..'
      imageElem.addEventListener('click', (e) => {
        const trial_data = {
          x: e.offsetX,
          y: e.offsetY,
        };
        jsPsych.finishTrial(trial_data);
      });
    };

    window.setTimeout(() => {
      goToClickOnChangeStep();
    }, trial.timeout);

    const handleSpacePress = () => {
      if (switchingImages) {
        goToClickOnChangeStep();
      }
    };

    const keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
      callback_function: handleSpacePress,
      valid_responses: ['space'],
      rt_method: 'date',
      persist: true,
      allow_held_key: false
    });
  };

  return plugin;
})();
