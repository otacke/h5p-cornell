// Import required classes
import Util from './h5p-cornell-util';

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
      a11y: {
        buttonToggleActive: 'toggle',
        buttonToggleInactive: 'toggle'
      }
    }, params || {});

    // Set missing callbacks
    this.callbacks = Util.extend({
      handlebuttonToggle: () => {
        console.warn('A function for handling the titlebar button is missing.');
      }
    }, callbacks || {});

    this.titleBar = document.createElement('div');
    this.titleBar.classList.add('h5p-cornell-title-bar');

    // Toggle button
    this.buttonToggle = document.createElement('div');
    this.buttonToggle.classList.add('h5p-cornell-button-overlay');
    this.buttonToggle.classList.add('h5p-cornell-active');
    this.buttonToggle.setAttribute('aria-pressed', true);
    this.buttonToggle.setAttribute('aria-label', this.params.a11y.buttonToggleActive);
    this.buttonToggle.setAttribute('role', 'button');
    this.buttonToggle.setAttribute('tabindex', '0');
    this.buttonToggle.setAttribute('title', this.params.a11y.buttonToggleActive);

    this.buttonToggle.addEventListener('click', this.callbacks.handlebuttonToggle);
    this.buttonToggle.addEventListener('keypress', this.callbacks.handlebuttonToggle);

    // Title
    const titleDOM = document.createElement('div');
    titleDOM.classList.add('h5p-cornell-title');
    titleDOM.innerHTML = this.params.title;

    // Date
    const dateDOM = document.createElement('div');
    dateDOM.classList.add('h5p-cornell-date');
    dateDOM.innerHTML = this.params.dateString;

    this.titleBar.appendChild(this.buttonToggle);
    this.titleBar.appendChild(titleDOM);
    this.titleBar.appendChild(dateDOM);
  }

  /**
   * Return the DOM for this class.
   * @return {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.titleBar;
  }

  /**
   * Toggle the button state.
   * @return {boolean} True, if button is active, else false.
   */
  toggleOverlayButton() {
    const active = this.buttonToggle.classList.toggle('h5p-cornell-active');

    const buttonLabel = (active) ?
      this.params.a11y.buttonToggleActive :
      this.params.a11y.buttonToggleInactive;

    this.buttonToggle.setAttribute('aria-label', buttonLabel);
    this.buttonToggle.setAttribute('aria-pressed', active);
    this.buttonToggle.setAttribute('title', buttonLabel);

    return active;
  }
}
