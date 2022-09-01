// Import required classes
import CornellButton from './h5p-cornell-button';
import Util from './h5p-cornell-util';
import './h5p-cornell-content-titlebar.scss';

/** Class representing the content */
export default class CornellContentTitlebar {
  /**
   * @constructor
   *
   * @param {object} params Parameter from editor.
   * @param {string} params.title Title.
   * @param {string} params.dateString Date.
   * @param {object} params.a11y Accessibility strings.
   * @param {string} params.a11y.buttonToggleActive Text for inactive button.
   * @param {string} params.a11y.buttonToggleInactive Text for inactive button.
   * @param {object} callbacks Callbacks.
   * @param {function} callbacks.handlebuttonToggle Handles click.
   */
  constructor(params, callbacks) {
    // Set missing params
    this.params = Util.extend({
      title: '',
      dateString: new Date().toLocaleDateString(),
      toggleButtonActiveOnStartup: true,
      a11y: {
        buttonToggleActive: 'toggle',
        buttonToggleInactive: 'toggle'
      }
    }, params || {});

    // Set missing callbacks
    this.callbacks = Util.extend({
      handleButtonToggle: () => {
        console.warn('A function for handling the toggle notes button is missing.');
      },
      handleButtonFullscreen: () => {
        console.warn('A function for handling the fullscreen button is missing.');
      }
    }, callbacks || {});

    this.titleBar = document.createElement('div');
    this.titleBar.classList.add('h5p-cornell-title-bar');

    const buttonToggleClasses = [
      'h5p-cornell-button',
      'h5p-cornell-button-toggle'
    ];
    if (this.params.toggleButtonActiveOnStartup === true) {
      buttonToggleClasses.push('h5p-cornell-active');
    }

    // Toggle button
    this.buttonToggle = new CornellButton(
      {
        type: 'toggle',
        classes: [
          'h5p-cornell-button',
          'h5p-cornell-button-toggle'
        ],
        a11y: {
          active: this.params.a11y.buttonToggleActive,
          inactive: this.params.a11y.buttonToggleInactive
        }
      },
      {
        onClick: (() => {
          this.callbacks.handleButtonToggle();
        })
      }
    );

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
        classes: [
          'h5p-cornell-button',
          'h5p-cornell-button-fullscreen'
        ],
        disabled: true,
        a11y: {
          active: this.params.a11y.buttonFullscreenExit,
          inactive: this.params.a11y.buttonFullscreenEnter
        }
      },
      {
        onClick: (() => {
          this.callbacks.handleButtonFullscreen();
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
   * @return {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.titleBar;
  }

  /**
   * Get toggle button state.
   * @return {boolean} True, if button is active, else false.
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
