// Import required classes
import Util from './../h5p-cornell-util';
import './h5p-cornell-exercise.scss';

/** Class representing the content */
export default class CornellExercise {
  /**
   * @class
   * @param {object} [params={}] Parameter from editor.
   * @param {object} [callbacks={}] Callbacks.
   */
  constructor(params = {}, callbacks = {}) {
    // Set missing params
    this.params = Util.extend({
      instructions: ''
    }, params);

    this.callbacks = Util.extend({
      resize: () => {}
    }, callbacks);

    const exerciseContent = document.createElement('div');
    exerciseContent.classList.add('h5p-cornell-exercise-content');

    const exerciseContentLibrary = document.createElement('div');
    exerciseContentLibrary.classList
      .add('h5p-cornell-exercise-content-library');

    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-cornell-exercise-content-wrapper');
    this.dom.appendChild(exerciseContent);

    let useSeparator = true;
    const machineName = this.params.exerciseContent?.library?.split(' ')[0];

    if (machineName) {
      /*
       * Override parameters - unfortunately can't be passed to library from
       * parent editor
       */
      switch (machineName) {
        case 'H5P.Audio':
          this.params.exerciseContent.params.controls = true;
          this.params.exerciseContent.params.fitToWrapper = true;
          this.params.exerciseContent.params.playerMode = 'full';
          break;
        case 'H5P.Video':
          this.params.exerciseContent.params.visuals.controls = true;
          this.params.exerciseContent.params.visuals.fit = false;
          break;
      }

      this.instance = H5P.newRunnable(
        this.params.exerciseContent,
        this.params.contentId,
        H5P.jQuery(exerciseContentLibrary),
        false,
        { previousState: this.params.previousState }
      );

      switch (machineName) {
        case 'H5P.Audio':
          // The height value that's set by H5P.Audio is counter-productive here
          if (this.instance.audio) {
            this.instance.audio.style.height = '';
          }

          useSeparator = false;

          break;

        case 'H5P.Video':
          // H5P.Video doesn't keep track of its playing state itself
          this.instance.on('stateChange', (event) => {
            this.mediumRunning = (event.data === 1);
          });

          useSeparator = false;

          this.instance.on('resize', () => {
            if (this.youtubeWrapper === undefined) {
              const youtubeVideo = this.dom
                .querySelector(
                  '.h5p-cornell-exercise-content-library.h5p-video.h5p-youtube'
                );

              this.youtubeWrapper = (youtubeVideo) ?
                youtubeVideo.firstChild :
                null;
            }

            this.resize(true);
          });

          // Resize when video is ready
          this.instance.on('ready', () => {
            this.callbacks.resize();
          });

          break;
      }

      exerciseContent.appendChild(
        this.createInstructionsDOM(this.params.instructions)
      );
      if (useSeparator) {
        exerciseContent.appendChild(
          this.createSeparatorDOM(this.params.instructions)
        );
      }
      exerciseContent.appendChild(exerciseContentLibrary);
    }
    else {
      const message = document.createElement('div');
      const messageText = 'No content was chosen for this exercise';
      console.warn(messageText);
      message.innerHTML = messageText;
      exerciseContentLibrary.appendChild(message);
    }
  }

  /**
   * Return the DOM for this class.
   *
   * @returns {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Create DOM for instructions.
   *
   * @param {string} [text=''] Text of instructions.
   * @returns {HTMLElement} DOM for instructions.
   */
  createInstructionsDOM(text = '') {
    const instructionsDOM = document.createElement('div');

    if (text !== '') {
      instructionsDOM.classList.add('h5p-cornell-instructions-wrapper');
      instructionsDOM.innerHTML = text;
    }

    return instructionsDOM;
  }

  /**
   * Create DOM for separator.
   *
   * @returns {HTMLElement} DOM for separator.
   */
  createSeparatorDOM() {
    const separatorDOM = document.createElement('div');
    separatorDOM.classList.add('h5p-cornell-content-separator');

    return separatorDOM;
  }

  /**
   * Resize.
   *
   * @param {boolean} fromVideo True, if resize call from video instance.
   */
  resize(fromVideo = false) {
    if (!this.instance) {
      return;
    }

    if (fromVideo) {
      return;
    }

    this.instance.trigger('resize');
  }

  /**
   * Get current state.
   *
   * @returns {object} Current state of instance.
   */
  getCurrentState() {
    if (typeof this.instance?.getCurrentState !== 'function') {
      return;
    }

    return this.instance.getCurrentState();
  }
}
