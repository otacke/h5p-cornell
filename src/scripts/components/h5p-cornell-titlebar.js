// Import required classes
import CornellButton from './h5p-cornell-button.js';
import { extend } from '@services/util.js';
import './h5p-cornell-titlebar.css';

/** Class representing the titlebar */
export default class CornellTitlebar {
  /**
   * @class
   * @param {object} params Parameter from editor.
   * @param {string} params.title Title.
   * @param {string} params.dateString Date.
   * @param {object} callbacks Callbacks.
   * @param {function} callbacks.onButtonFullscreen Handles fullscreen.
   */
  constructor(params = {}, callbacks = {}) {
    // Set missing params
    this.params = extend({
      title: '',
      dateString: new Date().toLocaleDateString(),
    }, params);

    // Set missing callbacks
    this.callbacks = extend({
      onButtonFullscreen: () => {
        console.warn('A function for handling the fullscreen button is missing.');
      },
    }, callbacks);

    this.titleBar = document.createElement('div');
    this.titleBar.classList.add('h5p-cornell-title-bar');

    // Title
    const titleDOM = document.createElement('div');
    titleDOM.classList.add('h5p-cornell-title');
    titleDOM.innerHTML = this.params.title;

    // Date
    const dateDOM = document.createElement('div');
    dateDOM.classList.add('h5p-cornell-date');
    dateDOM.innerHTML = this.params.dateString;

    this.buttonFullscreen = new CornellButton(
      {
        type: 'toggle',
        classes: [ 'h5p-cornell-button', 'h5p-cornell-button-fullscreen' ],
        disabled: true,
        a11y: {
          active: this.params.dictionary.get('a11y.buttonFullscreenExit'),
          inactive: this.params.dictionary.get('a11y.buttonFullscreenEnter'),
        },
      },
      {
        onClick: (() => {
          this.callbacks.onButtonFullscreen();
        }),
      },
    );

    this.titleBar.appendChild(titleDOM);
    this.titleBar.appendChild(dateDOM);
    this.titleBar.appendChild(this.buttonFullscreen.getDOM());
  }

  /**
   * Return the DOM for this class.
   * @returns {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.titleBar;
  }

  /**
   * Get toggle button state.
   * @returns {boolean} True, if button is active, else false.
   */
  getToggleButtonState() {
    return this.buttonToggle.isActive();
  }

  /**
   * Enable fullscreen button.
   */
  enableFullscreenButton() {
    this.buttonFullscreen.enable();
  }

  /**
   * Set fullscreen button state.
   * @param {string|boolean} state enter|false for enter, exit|true for exit.
   */
  toggleFullscreenButton(state) {
    if (typeof state === 'string') {
      if (state === 'enter') {
        state = false;
      }
      else if (state === 'exit') {
        state = true;
      }
    }

    if (typeof state === 'boolean') {
      this.buttonFullscreen.toggle(state);
    }
  }
}
