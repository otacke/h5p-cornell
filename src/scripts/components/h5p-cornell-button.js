// Import required classes
import Util from './../h5p-cornell-util';
import './h5p-cornell-button.scss';

/** Class representing the content */
export default class CornellButton {
  /**
   * @class
   * @param {object} params Parameter from editor.
   * @param {object} [callbacks] Callbacks.
   */
  constructor(params, callbacks) {
    // Set missing params
    this.params = Util.extend({
      a11y: {
        active: '',
        disabled: '',
        inactive: ''
      },
      active: false,
      classes: [],
      disabled: false,
      type: 'pulse'
    }, params || {});

    if (!Array.isArray(this.params.classes)) {
      this.params.classes = [this.params.classes];
    }

    if (this.params.type === 'pulse') {
      if (!this.params.a11y.inactive) {
        this.params.a11y.inactive = this.params.a11y.active || '';
      }
      if (!this.params.a11y.active) {
        this.params.a11y.active = this.params.a11y.inactive || '';
      }
    }

    this.active = this.params.active;
    this.disabled = this.params.disabled;

    // Sanitize callbacks
    this.callbacks = callbacks || {};
    this.callbacks.onClick = this.callbacks.onClick || (() => {});

    // Button
    this.button = document.createElement('button');

    if (this.params.classes) {
      this.params.classes.forEach((className) => {
        this.button.classList.add(className);
      });
    }
    this.button.setAttribute('aria-pressed', this.params.active);
    this.button.setAttribute('tabindex', '0');

    if (this.params.active === true) {
      this.activate();
    }
    else {
      this.deactivate();
    }

    if (this.params.disabled === true) {
      this.disable();
    }
    else {
      this.enable();
    }

    this.button.addEventListener('click', (event) => {
      if (this.disabled) {
        return;
      }

      if (this.params.type === 'toggle') {
        this.toggle();
      }
      this.callbacks.onClick(event);
    });
  }

  /**
   * Return the DOM for this class.
   *
   * @returns {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.button;
  }

  /**
   * Show button.
   */
  show() {
    this.button.classList.remove('h5p-cornell-display-none');
  }

  /**
   * Hide button.
   */
  hide() {
    this.button.classList.add('h5p-cornell-display-none');
  }

  /**
   * Enable button.
   */
  enable() {
    this.disabled = false;

    this.button.classList.remove('h5p-cornell-button-disabled');

    if (this.active) {
      this.activate();
    }
    else {
      this.deactivate();
    }
  }

  /**
   * Disable button.
   */
  disable() {
    this.button.classList.add('h5p-cornell-button-disabled');
    this.button.setAttribute('aria-label', this.params.a11y.disabled);
    this.button.setAttribute('title', this.params.a11y.disabled);

    this.disabled = true;
  }

  /**
   * Activate button.
   */
  activate() {
    if (this.disabled) {
      return;
    }

    if (this.params.type === 'toggle') {
      this.button.classList.add('h5p-cornell-button-active');
      this.button.setAttribute('aria-pressed', true);
    }

    this.button.setAttribute('aria-label', this.params.a11y.active);
    this.button.setAttribute('title', this.params.a11y.active);

    this.active = true;
  }

  /**
   * Deactivate button.
   */
  deactivate() {
    if (this.disabled) {
      return;
    }

    this.active = false;

    if (this.params.type === 'toggle') {
      this.button.classList.remove('h5p-cornell-button-active');
      this.button.setAttribute('aria-pressed', false);
    }

    this.button.setAttribute('aria-label', this.params.a11y.inactive);
    this.button.setAttribute('title', this.params.a11y.inactive);
  }

  /**
   * Toggle active state.
   *
   * @param {boolean} active If true, force active; if false, force inactive.
   */
  toggle(active) {
    if (this.disabled) {
      return;
    }

    active = (typeof active === 'boolean') ? active : !this.active;

    if (active) {
      this.activate();
    }
    else {
      this.deactivate();
    }
  }

  /**
   * Determine whether button is active.
   *
   * @returns {boolean} True, if button is active, else false.
   */
  isActive() {
    return this.active;
  }

  /**
   * Determine whether button is disabled.
   *
   * @returns {boolean} True, if button is disabled, else false.
   */
  isDisabled() {
    return this.disabled;
  }
}
