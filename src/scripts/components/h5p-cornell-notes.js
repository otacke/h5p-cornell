// Import required classes
import Dictionary from './../services/dictionary';
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
    this.areNotesInvisible = !(this.params?.previousState?.notesInvisible ||
      false);

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

    this.textArea = this.instance.$inputField.get(0);
    if (!this.textArea) {
      return;
    }

    // Relay changes to parent
    ['change', 'keyup', 'paste'].forEach((eventName) => {
      this.textArea.addEventListener(eventName, () => {
        if (this.getText() !== this.previousInput) {
          this.callbacks.onChanged();
        }

        this.previousInput = this.getText();
      });
    });

    const textInputField = this.textArea.parentNode;

    // Label for notes
    const titlebar = document.createElement('div');
    titlebar.classList.add('h5p-cornell-notes-titlebar');

    // Using instance's label because it's used for ARIA
    const label = textInputField.firstChild;
    textInputField.insertBefore(titlebar, label);
    titlebar.appendChild(label);

    this.buttonVisibility = document.createElement('button');
    this.buttonVisibility.classList.add('h5p-cornell-notes-button-visibility');
    this.handleNotesVisibility();
    this.buttonVisibility.addEventListener('click', () => {
      this.handleNotesVisibility();
      this.callbacks.onChanged();
    });
    titlebar.appendChild(this.buttonVisibility);
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

    // Trying to use instance getCurentState as much as possible
    const state = this.instance.getCurrentState();
    if (this.areNotesInvisible) {
      state.inputField = this.previousInput;
    }
    state.notesInvisible = this.areNotesInvisible;

    return state;
  }

  /**
   * Handle notes visibility.
   */
  handleNotesVisibility() {
    if (this.areNotesInvisible) {
      this.areNotesInvisible = false;
      this.textArea.value = this.previousInput;
      this.textArea.setAttribute(
        'placeholder', Util.htmlDecode(this.params.placeholder)
      );
      this.textArea.removeAttribute('disabled');
      this.buttonVisibility.classList.remove('hidden');
      this.buttonVisibility.setAttribute(
        'aria-label',
        Dictionary.get('a11y.notesHide').replace(/@label/g, this.params.label)
      );
    }
    else {
      this.areNotesInvisible = true;

      this.textArea.removeAttribute('placeholder');
      this.textArea.value = '';
      this.textArea.setAttribute('disabled', 'disabled');

      this.buttonVisibility.classList.add('hidden');
      this.buttonVisibility.setAttribute(
        'aria-label',
        Dictionary.get('a11y.notesShow').replace(/@label/g, this.params.label)
      );
    }
  }

  /**
   * Reset.
   */
  reset() {
    this.instance?.setState({});
  }
}
