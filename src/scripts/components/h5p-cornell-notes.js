// Import required classes
import Dictionary from '@services/dictionary.js';
import Util from '@services/util.js';
import './h5p-cornell-notes.scss';

/** Class representing the content */
export default class CornellNotes {
  /**
   * @class
   * @param {object} [params] Parameter from editor.
   * @param {object} [callbacks] Callbacks.
   */
  constructor(params = {}, callbacks = {}) {
    // Set missing params
    this.params = Util.extend({
      previousState: {},
    }, params || {});

    this.callbacks = Util.extend({
      onChanged: () => {},
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
        library: 'H5P.TextInputField 1.2',
      },
      this.params.contentId,
      H5P.jQuery(wrapper),
      false,
      { previousState: this.params.previousState },
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
        if (this.areNotesInvisible) {
          return;
        }

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
    this.toggleNotesVisibility();
    this.buttonVisibility.addEventListener('click', () => {
      this.toggleNotesVisibility();
      this.callbacks.onChanged();
    });
    titlebar.appendChild(this.buttonVisibility);
  }

  /**
   * Return the DOM for this class.
   * @returns {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Get text.
   * @returns {string} Text.
   */
  getText() {
    return this.instance?.getInput().value;
  }

  /**
   * Get current state.
   * @returns {object|undefined} Current state.
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

    /* Set `null` instead of `false` to get a state object that is considered
     * empty when passed to H5P.isEmpty. Otherwise, some H5P integrations
     * such as H5P.com may interpret the state as relevant for being reset and
     * display a respective button.
     */
    state.notesInvisible = this.areNotesInvisible || null;

    return state;
  }

  /**
   * Handle notes visibility.
   */
  toggleNotesVisibility() {
    if (this.areNotesInvisible) {
      this.areNotesInvisible = false;
      this.textArea.value = this.previousInput;
      this.textArea.setAttribute(
        'placeholder', Util.htmlDecode(this.params.placeholder),
      );
      this.textArea.removeAttribute('disabled');
      this.buttonVisibility.classList.remove('hidden');
      this.buttonVisibility.setAttribute(
        'aria-label',
        Dictionary.get('a11y.notesHide').replace(/@label/g, this.params.label),
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
        Dictionary.get('a11y.notesShow').replace(/@label/g, this.params.label),
      );
    }
  }

  /**
   * Reset.
   */
  reset() {
    this.instance?.setState({});

    // Make notes visible again and clear them
    this.areNotesInvisible = true;
    this.previousInput = '';
    this.toggleNotesVisibility();
  }
}
