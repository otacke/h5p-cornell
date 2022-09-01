// Import required classes
import Util from './../h5p-cornell-util';
import './h5p-cornell-notes.scss';

/** Class representing the content */
export default class CornellNotes {
  /**
   * @class
   * @param {object} [params={}] Parameter from editor.
   * @param {object} [callbacks={}] Callbacks.
   */
  constructor(params = {}, callbacks = {}) {
    // Set missing params
    this.params = Util.extend({
      previousState: {}
    }, params || {});

    this.callbacks = Util.extend({
      onChanged: () => {}
    }, callbacks || {});

    this.previousInput = this.params?.previousState?.inputField || '';

    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-cornell-notes-field');
    if (this.params.class) {
      this.dom.classList.add(this.params.class);
    }

    const wrapper = document.createElement('div');
    this.dom.appendChild(wrapper);

    this.instance = H5P.newRunnable(
      {
        params: {
          taskDescription: this.params.label,
          placeholderText: Util.htmlDecode(this.params.placeholder),
          inputFieldSize: this.params.size,
        },
        library: 'H5P.TextInputField 1.2'
      },
      this.params.contentId,
      H5P.jQuery(wrapper),
      false,
      { previousState: this.params.previousState }
    );

    if (!this.instance) {
      return;
    }

    ['change', 'keyup', 'paste'].forEach((eventName) => {

      this.instance.$inputField.get(0).addEventListener(eventName, () => {
        if (this.getText() !== this.previousInput) {
          this.callbacks.onChanged();
        }

        this.previousInput = this.getText();
      });
    });
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
   * Get text.
   *
   * @returns {string} Text.
   */
  getText() {
    return this.instance?.getInput().value;
  }

  /**
   * Get current state.
   *
   * @returns {object} Current state.
   */
  getCurrentState() {
    if (!this.instance) {
      return;
    }

    return this.instance.getCurrentState();
  }

  /**
   * Reset.
   */
  reset() {
    this.instance?.setState({});
  }
}
