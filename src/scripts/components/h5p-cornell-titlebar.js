// Import required classes
import CornellButton from './h5p-cornell-button';
import Dictionary from './../services/dictionary';
import Util from './../h5p-cornell-util';
import './h5p-cornell-titlebar.scss';

/** Class representing the titlebar */
export default class CornellTitlebar {
  /**
   * @class
   * @param {object} params Parameter from editor.
   * @param {string} params.title Title.
   * @param {string} params.dateString Date.
   * @param {object} callbacks Callbacks.
   * @param {function} callbacks.onButtonToggle Handles notes toggling .
   * @param {function} callbacks.onButtonFullscreen Handles fullscreen.
   */
  constructor(params = {}, callbacks = {}) {
    // Set missing params
    this.params = Util.extend({
      title: '',
      dateString: new Date().toLocaleDateString(),
      toggleButtonActiveOnStartup: true
    }, params);

    // Set missing callbacks
    this.callbacks = Util.extend({
      onButtonToggle: () => {
        console.warn('A function for handling the toggle notes button is missing.');
      },
      onButtonFullscreen: () => {
        console.warn('A function for handling the fullscreen button is missing.');
      }
    }, callbacks);

    this.titleBar = document.createElement('div');
    this.titleBar.classList.add('h5p-cornell-title-bar');

    // Toggle button
    this.buttonToggle = new CornellButton(
      {
        type: 'toggle',
        classes: [ 'h5p-cornell-button', 'h5p-cornell-button-toggle' ],
        a11y: {
          active: Dictionary.get('a11y.buttonToggleCloseNotes'),
          inactive: Dictionary.get('a11y.buttonToggleOpenNotes')
        }
      },
      {
        onClick: (() => {
          this.callbacks.onButtonToggle();
        })
      }
    );

    if (this.params.toggleButtonActiveOnStartup === true) {
      this.buttonToggle.activate();
    }

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
          active: Dictionary.get('a11y.buttonFullscreenExit'),
          inactive: Dictionary.get('a11y.buttonFullscreenEnter')
        }
      },
      {
        onClick: (() => {
          this.callbacks.onButtonFullscreen();
        })
      }
    );

    this.titleBar.appendChild(this.buttonToggle.getDOM());
    this.titleBar.appendChild(titleDOM);
    this.titleBar.appendChild(dateDOM);
    this.titleBar.appendChild(this.buttonFullscreen.getDOM());
  }

  /**
   * Return the DOM for this class.
   *
   * @returns {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.titleBar;
  }

  /**
   * Get toggle button state.
   *
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
   *
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
