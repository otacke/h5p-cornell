// Import required classes
import CornellTitlebar from './components/h5p-cornell-titlebar';
import CornellExercise from './components/h5p-cornell-exercise';
import CornellNotes from './components/h5p-cornell-notes';
import Dictionary from './services/dictionary';
import Util from './h5p-cornell-util';

/**
 * Class representing the content.
 */
export default class CornellContent {
  /**
   * @class
   * @param {object} params Parameters.
   * @param {object} params.params Parameters from editor.
   * @param {number} params.contentId Content ID.
   * @param {object} [params.extras] Extras incl. previous state.
   * @param {boolean} [params.isRoot] If true, running standalone.
   * @param {object} [callbacks={}] Callbacks.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({
      extras: {}
    }, params);

    // Create values to fill with
    this.previousState = Util.extend(
      {
        dateString: new Date().toLocaleDateString(),
        recall: {inputField: ''},
        mainNotes: {inputField: ''},
        summary: {inputField: ''}
      },
      this.params.extras.previousState || {}
    );

    // Callbacks
    this.callbacks = Util.extend({
      getCurrentState: () => {},
      onButtonFullscreen: () => {},
      read: () => {},
      resize: () => {}
    }, callbacks);

    this.isExerciseMode = !this.params.behaviour.showNotesOnStartup;

    // TODO: Request H5P core to set a flag that can be queried instead
    const canStoreUserState = H5PIntegration.saveFreq !== undefined &&
      H5PIntegration.saveFreq !== false;

    this.content = document.createElement('div');
    this.content.classList.add('h5p-cornell-container');

    this.titlebar = this.createTitleBar();
    this.content.appendChild(this.titlebar.getDOM());

    if (!canStoreUserState) {
      this.messageBox = document.createElement('div');
      this.messageBox.classList.add('h5p-cornell-message-box');
      const message = document.createElement('p');
      message.classList.add('h5p-cornell-message');
      message.innerHTML = Dictionary.get('l10n.noSaveContentState');
      this.messageBox.appendChild(message);
      this.content.appendChild(this.messageBox);
    }

    const panel = document.createElement('div');
    panel.classList.add('h5p-cornell-panel');

    this.exerciseWrapper = this.createExerciseDOM();
    panel.appendChild(this.exerciseWrapper);

    this.notesWrapper = this.createNotesDOM();
    panel.appendChild(this.notesWrapper);

    const buttonsWrapper = document.createElement('div');
    buttonsWrapper.classList.add('h5p-cornell-buttons-wrapper');

    // Save state to platform button
    if (canStoreUserState) {
      this.buttonSave = H5P.JoubelUI.createButton({
        type: 'button',
        html: Dictionary.get('l10n.save'),
        ariaLabel: Dictionary.get('l10n.save'),
        class: 'h5p-cornell-button-save h5p-cornell-disabled',
        disabled: true,
        on: {
          click: () => {
            this.handleSave();
          }
        }
      }).get(0);
      buttonsWrapper.appendChild(this.buttonSave);
    }

    // Copy to clipboard button
    this.buttonCopy = H5P.JoubelUI.createButton({
      type: 'button',
      html: Dictionary.get('l10n.copy'),
      ariaLabel: Dictionary.get('l10n.copy'),
      class: 'h5p-cornell-button-copy',
      on: {
        click: () => {
          this.handleCopy();
        }
      }
    }).get(0);
    buttonsWrapper.appendChild(this.buttonCopy);

    this.notesWrapper.appendChild(buttonsWrapper);

    this.content.appendChild(panel);
  }

  /**
   * Return the DOM for this class.
   *
   * @returns {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.content;
  }

  /**
   * Create titlebar.
   *
   * @returns {CornellTitlebar} Titlebar.
   */
  createTitleBar() {
    return new CornellTitlebar(
      {
        title: this.params.headline || this.params.extras.metadata?.title || '',
        dateString: this.previousState.dateString,
        toggleButtonActiveOnStartup: this.params.behaviour.showNotesOnStartup
      },
      {
        onButtonToggle: (event) => this.handleButtonToggle(event),
        onButtonFullscreen: this.callbacks.onButtonFullscreen
      }
    );
  }

  /**
   * Append exercise.
   *
   * @returns {HTMLElement} Exercise.
   */
  createExerciseDOM() {
    // Exercise with H5P Content
    const exerciseWrapper = document.createElement('div');
    exerciseWrapper.classList.add('h5p-cornell-exercise-wrapper');

    if (!this.isExerciseMode) {
      exerciseWrapper.classList.add('h5p-cornell-notes-mode');
    }

    this.exercise = new CornellExercise(
      {
        exerciseContent: this.params.exerciseContent,
        contentId: this.params.contentId,
        previousState: this.previousState.exercise,
        instructions: this.params.instructions
      },
      {
        resize: () => {
          this.callbacks.resize();
        }
      }
    );
    exerciseWrapper.appendChild(this.exercise.getDOM());

    // If notes are opened and display is too narrow, undisplay excercise
    exerciseWrapper.addEventListener('transitionend', () => {
      if (!this.isExerciseMode) {
        if (exerciseWrapper.offsetWidth === 0) {
          exerciseWrapper.classList.add('h5p-cornell-display-none');
        }
        setTimeout(() => {
          this.resize();
        }, 0);
      }
    });

    return exerciseWrapper;
  }

  /**
   * Create notes.
   *
   * @returns {HTMLElement} Notes.
   */
  createNotesDOM() {
    // Cornell Notes
    const notesWrapper = document.createElement('div');
    notesWrapper.classList.add('h5p-cornell-notes-wrapper');

    if (!this.isExerciseMode) {
      notesWrapper.classList.add('h5p-cornell-notes-mode');
    }
    else {
      notesWrapper.classList.add('h5p-cornell-display-none');
    }

    // Hide wrapper after it moved out of sight to prevent receiving tab focus
    notesWrapper.addEventListener('transitionend', () => {
      if (this.isExerciseMode) {
        notesWrapper.classList.add('h5p-cornell-display-none');
      }
      setTimeout(() => {
        this.resize();
      }, 0);
    });

    const notesContentWrapper = document.createElement('div');
    notesContentWrapper.classList.add('h5p-cornell-notes-content-wrapper');

    notesWrapper.appendChild(notesContentWrapper);

    notesContentWrapper.appendChild(this.createMainNotesDOM());
    notesContentWrapper.appendChild(this.createSummaryDOM());

    return notesWrapper;
  }

  /**
   * Create DOM for main notes.
   *
   * @returns {HTMLElement} DOM for main notes.
   */
  createMainNotesDOM() {
    const mainNotesDOM = document.createElement('div');
    mainNotesDOM.classList.add('h5p-cornell-main-notes-wrapper');

    this.recall = new CornellNotes(
      {
        label: this.params.notesFields.recallTitle,
        class: 'h5p-cornell-main-notes-recall-wrapper',
        placeholder: Util.htmlDecode(this.params.notesFields.recallPlaceholder),
        size: this.params.fieldSizeNotes,
        previousState: this.previousState.recall,
        contentId: this.params.contentId
      },
      {
        onChanged: () => {
          this.handleFieldChanged();
        }
      }
    );
    mainNotesDOM.appendChild(this.recall.getDOM());

    this.mainNotes = new CornellNotes(
      {
        label: this.params.notesFields.notesTitle,
        class: 'h5p-cornell-main-notes-notes-wrapper',
        placeholder: Util.htmlDecode(this.params.notesFields.notesPlaceholder),
        size: this.params.fieldSizeNotes,
        previousState: this.previousState.mainNotes,
        contentId: this.params.contentId
      },
      {
        onChanged: () => {
          this.handleFieldChanged();
        }
      }
    );
    mainNotesDOM.appendChild(this.mainNotes.getDOM());

    return mainNotesDOM;
  }

  /**
   * Create DOM for summary.
   *
   * @returns {HTMLElement} DOM for summary.
   */
  createSummaryDOM() {
    const summaryDOM = document.createElement('div');
    summaryDOM.classList.add('h5p-cornell-summary-wrapper');

    this.summary = new CornellNotes(
      {
        label: this.params.notesFields.summaryTitle,
        class: 'h5p-cornell-summary-notes-summary-wrapper',
        placeholder: Util.htmlDecode(this.params.notesFields.notesPlaceholder),
        size: this.params.fieldSizeNotes,
        previousState: this.previousState.mainNotes,
        contentId: this.params.contentId
      },
      {
        onChanged: () => {
          this.handleFieldChanged();
        }
      }
    );
    summaryDOM.appendChild(this.summary.getDOM());

    return summaryDOM;
  }

  /**
   * Resize content.
   *
   * @param {boolean} [fromVideo=false] If true, will skip resize on exercise.
   */
  resize(fromVideo = false) {
    if (this.exercise && !fromVideo) {
      /*
       * In H5P.Video for YouTube, once wrapper width gets 0 it's locked. We
       * need to set excercise wrapper width = 0 however for shrinking. Fixed
       * here.
       */
      if (this.youtubeWrapper) {
        this.youtubeWrapper.style.width = '100%';
      }

      setTimeout(() => {
        this.exercise.resize();
      }, 0);
    }

    // Not done using media query because display needs to be not-none first
    if (this.content.offsetWidth < this.params.minWidthForDualView) {
      if (!this.isNarrowScreen) {
        this.isNarrowScreen = true;

        // Triggers a transition, display set to none afterwards by listener
        this.exerciseWrapper.classList.add('h5p-cornell-narrow-screen');
      }
    }
    else {
      this.exerciseWrapper.classList.remove('h5p-cornell-display-none');
      setTimeout(() => {
        this.exerciseWrapper.classList.remove('h5p-cornell-narrow-screen');
      }, 0);

      if (this.isNarrowScreen) {
        this.isNarrowScreen = false;
      }
    }

    if (typeof this.callbacks.resize === 'function') {
      this.callbacks.resize();
    }
  }

  /**
   * Enable fullscreen button in titlebar.
   */
  enableFullscreenButton() {
    this.titlebar.enableFullscreenButton();
  }

  /**
   * Set dimensions to fullscreen.
   *
   * @param {boolean} enterFullScreen If true, enter fullscreen, else exit.
   */
  toggleFullscreen(enterFullScreen = false) {
    this.titlebar.toggleFullscreenButton(enterFullScreen);

    if (enterFullScreen === true) {
      /*
       * Give browser some time to go to fullscreen mode and return proper
       * viewport height
       */
      setTimeout(() => {
        const messageHeight = this.messageBox ?
          this.messageBox.offsetHeight :
          0;

        const maxHeight = `${window.innerHeight -
          this.titlebar.getDOM().offsetHeight - messageHeight}px`;

        this.exerciseWrapper.style.maxHeight = maxHeight;
        this.notesWrapper.style.maxHeight = maxHeight;
      }, 100);
    }
    else {
      this.exerciseWrapper.style.maxHeight = '';
      this.notesWrapper.style.maxHeight = '';

      setTimeout(() => {
        this.resize();
      }, 0);
    }
  }

  /**
   * Handle activation of overlay button.
   */
  handleButtonToggle() {
    const active = this.titlebar.getToggleButtonState();
    const message = (active) ?
      Dictionary.get('a11y.notesOpened') :
      Dictionary.get('a11y.notesClosed');
    this.callbacks.read(Util.stripHTML(message));

    this.toggleView();
  }

  /**
   * Toggle between exercise and notes.
   */
  toggleView() {
    // Show hidden wrappers to allow transition
    this.exerciseWrapper.classList.remove('h5p-cornell-display-none');
    this.notesWrapper.classList.remove('h5p-cornell-display-none');

    // Give DOM time to set display property
    setTimeout(() => {
      this.exerciseWrapper.classList.toggle('h5p-cornell-notes-mode');
      this.notesWrapper.classList.toggle('h5p-cornell-notes-mode');

      this.isExerciseMode = !this.isExerciseMode;

      this.resize();
    }, 0);
  }

  /**
   * Strip tags from text in H5P TextInputField object. Don't want those here.
   *
   * @param {object} fieldState Save state object to be cleaned.
   * @returns {object} Save state object with cleaned text.
   */
  stripTags(fieldState) {
    fieldState.inputField = Util.htmlDecode(fieldState.inputField);
    return fieldState;
  }

  /**
   * Detect if some answer was given.
   *
   * @returns {boolean} True if some notes was typed.
   */
  getAnswerGiven() {
    return (
      this.recall.getText().length +
      this.mainNotes.getText().length +
      this.summary.getText().length
    ) > 0;
  }

  /**
   * Reset notes.
   */
  resetNotes() {
    this.recall.reset();
    this.mainNotes.reset();
    this.summary.reset();
  }

  /**
   * Get current state to be saved.
   *
   * @returns {object} Current state.
   */
  getCurrentState() {
    return {
      dateString: this.previousState.dateString,
      recall: this.stripTags(this.recall.getCurrentState()),
      mainNotes: this.stripTags(this.mainNotes.getCurrentState()),
      summary: this.stripTags(this.summary.getCurrentState()),
      exercise: this.exercise.getCurrentState()
    };
  }

  /**
   * Save current state. Could be triggered indirectly by emitting an xAPI
   * 'progressed' statement, but this would include a 3 second delay.
   */
  handleSave() {
    /*
     * If Cornell instance is not running on its own, storing the state
     * directly requires to get the root content's currentState, because
     * we're writing the state for the whole content directly.
     */
    let getCurrentStateProvider;
    if (this.params.isRoot) {
      getCurrentStateProvider = this.callbacks;
    }
    else if (typeof H5P.instances[0].getCurrentState === 'function') {
      getCurrentStateProvider = H5P.instances[0]; // Always first instance here
    }

    if (getCurrentStateProvider) {
      // Using callback to also store in LocalStorage
      H5P.setUserData(
        this.params.contentId,
        'state',
        getCurrentStateProvider.getCurrentState(),
        { deleteOnChange: false }
      );
    }
    else {
      // Fallback, parent doesn't store state, at least store in local storage
      this.callbacks.getCurrentState();
    }

    if (this.buttonSave) {
      H5P.attachToastTo(
        this.buttonSave,
        Dictionary.get('l10n.notesSaved'), { position: {
          horizontal: 'centered',
          noOverflowRight: true,
          offsetVertical: 5,
          vertical: 'above'
        }}
      );

      this.buttonSave.classList.add('h5p-cornell-disabled');
      this.buttonSave.setAttribute('disabled', 'disabled');
    }

    this.callbacks.read(Dictionary.get('l10n.notesSaved'));
  }

  /**
   * Handle copy button
   */
  handleCopy() {
    const notes = (this.stripTags(this.mainNotes.getCurrentState())).inputField;
    const cue = (this.stripTags(this.recall.getCurrentState())).inputField;
    const summary = (this.stripTags(this.summary.getCurrentState()).inputField);

    const text = [
      `## ${this.params.notesFields.notesTitle}\n${notes}`,
      `## ${this.params.notesFields.recallTitle}\n${cue}`,
      `## ${this.params.notesFields.summaryTitle}\n${summary}`
    ].join('\n\n');

    Util.copyTextToClipboard(text, (result) => {
      const message = (result === true) ?
        Dictionary.get('l10n.copyToClipboardSuccess') :
        Dictionary.get('l10n.copyToClipboardError');

      H5P.attachToastTo(this.buttonCopy, message, {position: {
        horizontal: 'centered',
        noOverflowRight: true,
        offsetVertical: 5,
        vertical: 'above'
      }});

      this.callbacks.read(message);
    });
  }

  /**
   * Handle field changed.
   */
  handleFieldChanged() {
    if (!this.buttonSave) {
      return;
    }

    this.buttonSave.classList.remove('h5p-cornell-disabled');
    this.buttonSave.removeAttribute('disabled');
  }
}

/** @constant {number} */
CornellContent.MODE_EXERCISE = 0;

/** @constant {number} */
CornellContent.MODE_NOTES = 1;
