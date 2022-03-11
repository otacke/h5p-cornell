// Import required classes
import CornellContentTitlebar from './h5p-cornell-content-titlebar';
import Util from './h5p-cornell-util';

/** Class representing the content
 *
 * This class could be split into one "page" that the actual content
 * could extend, but for now it's both pages in one.
 */
export default class CornellContent {
  /**
   * @constructor
   *
   * @param {object} textField Parameter from editor.
   * @param {number} contentId Content ID.
   * @param {object} [extras] Extras incl. previous state.
   * @param {object} [callbacks] Callbacks.
   */
  constructor(params, contentId, extras, callbacks) {
    this.params = params;
    this.contentId = contentId;
    this.extras = extras;

    // Create values to fill with
    this.previousState = Util.extend(
      {
        dateString: new Date().toLocaleDateString(),
        recall: {inputField: ''},
        mainNotes: {inputField: ''},
        summary: {inputField: ''}
      },
      extras.previousState || {}
    );

    // Callbacks
    this.callbacks = callbacks || {};
    this.callbacks.handleButtonFullscreen = callbacks.handleButtonFullscreen || (() => {});

    this.isExerciseMode = !this.params.behaviour.showNotesOnStartup;

    this.content = document.createElement('div');
    this.content.classList.add('h5p-cornell-container');

    this.titlebar = this.createTitleBar();
    this.content.appendChild(this.titlebar.getDOM());

    const panel = document.createElement('div');
    panel.classList.add('h5p-cornell-panel');

    this.exerciseWrapper = this.createExerciseDOM();
    panel.appendChild(this.exerciseWrapper);

    this.notesWrapper = this.createNotesDOM();
    panel.appendChild(this.notesWrapper);

    const buttonsWrapper = document.createElement('div');
    buttonsWrapper.classList.add('h5p-cornell-buttons-wrapper');

    // Save state to platform button
    // TODO: Request H5P core to set a flag that can be queried instead
    if (H5PIntegration.saveFreq !== undefined && H5PIntegration.saveFreq !== false) {
      this.buttonSave = H5P.JoubelUI.createButton({
        type: 'button',
        html: this.params.l10n.save,
        ariaLabel: this.params.l10n.save,
        class: 'h5p-cornell-button-save',
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
      html: this.params.l10n.copy,
      ariaLabel: this.params.l10n.copy,
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
   * @return {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.content;
  }

  /**
   * Create titlebar.
   * @return {CornellContentTitlebar} Titlebar.
   */
  createTitleBar() {
    return new CornellContentTitlebar(
      {
        title: this.extras.metadata.title,
        dateString: this.previousState.dateString,
        toggleButtonActiveOnStartup: this.params.behaviour.showNotesOnStartup,
        a11y: {
          buttonToggleActive: this.params.a11y.buttonToggleCloseNotes,
          buttonToggleInactive: this.params.a11y.buttonToggleOpenNotes,
          buttonFullscreenEnter: this.params.a11y.buttonFullscreenEnter,
          buttonFullscreenExit: this.params.a11y.buttonFullscreenExit
        }
      },
      {
        handleButtonToggle: (event) => this.handleButtonToggle(event),
        handleButtonFullscreen: this.callbacks.handleButtonFullscreen
      }
    );
  }

  /**
   * Append exercise.
   * @return {HTMLElement} Exercise.
   */
  createExerciseDOM() {
    // Exercise with H5P Content
    const exerciseWrapper = document.createElement('div');
    exerciseWrapper.classList.add('h5p-cornell-exercise-wrapper');

    if (!this.isExerciseMode) {
      exerciseWrapper.classList.add('h5p-cornell-notes-mode');
    }

    const exerciseContent = document.createElement('div');
    exerciseContent.classList.add('h5p-cornell-exercise-content');

    const exerciseContentLibrary = document.createElement('div');
    exerciseContentLibrary.classList.add('h5p-cornell-exercise-content-library');

    const exerciseContentWrapper = document.createElement('div');
    exerciseContentWrapper.classList.add('h5p-cornell-exercise-content-wrapper');
    exerciseContentWrapper.appendChild(exerciseContent);

    exerciseWrapper.appendChild(exerciseContentWrapper);

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

    if (this.params.exerciseContent && this.params.exerciseContent.library) {
      this.exerciseMachineName = this.params.exerciseContent.library.split(' ')[0];
    }

    let useSeparator = true;

    if (this.exerciseMachineName !== undefined) {
      // Override params - unfortunately can't be passed to library from parent editor
      switch (this.exerciseMachineName) {
        case 'H5P.Audio':
          this.params.exerciseContent.params.controls = true;
          this.params.exerciseContent.params.fitToWrapper = true;
          this.params.exerciseContent.params.playerMode = "full";
          break;
        case 'H5P.Video':
          this.params.exerciseContent.params.visuals.controls = true;
          this.params.exerciseContent.params.visuals.fit = false;
          break;
      }

      this.exercise = H5P.newRunnable(
        this.params.exerciseContent,
        this.contentId,
        H5P.jQuery(exerciseContentLibrary),
        false,
        {previousState: this.previousState.exercise}
      );

      switch (this.exerciseMachineName) {
        case 'H5P.Audio':
          // The height value that is set by H5P.Audio is counter-productive here
          if (this.exercise.audio) {
            this.exercise.audio.style.height = '';
          }

          useSeparator = false;

          break;
        case 'H5P.Video':
          // H5P.Video doesn't keep track of its playing state itself
          this.exercise.on('stateChange', (event) => {
            this.mediumRunning = (event.data === 1);
          });

          useSeparator = false;

          this.exercise.on('resize', () => {
            if (this.youtubeWrapper === undefined) {
              const youtubeVideo = document.querySelector('.h5p-cornell-exercise-content-library.h5p-video.h5p-youtube');
              this.youtubeWrapper = (youtubeVideo) ? youtubeVideo.firstChild : null;
            }

            this.resize(true);
          });

          break;
      }

      exerciseContent.appendChild(this.createInstructionsDOM());
      if (useSeparator) {
        exerciseContent.appendChild(this.createSeparatorDOM());
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

    return exerciseWrapper;
  }

  /**
   * Create notes.
   * @return {HTMLElement} Notes.
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

    // Hide wrapper after it has been moved out of sight to prevent receiving tab focus
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
   * Create DOM for instructions.
   * @return {HTMLElement} DOM for instructions.
   */
  createInstructionsDOM() {
    const instructionsDOM = document.createElement('div');

    if (this.params.instructions !== '') {
      instructionsDOM.classList.add('h5p-cornell-instructions-wrapper');
      instructionsDOM.innerHTML = this.params.instructions;
    }

    return instructionsDOM;
  }

  /**
   * Create DOM for separator.
   * @return {HTMLElement} DOM for separator.
   */
  createSeparatorDOM() {
    const separatorDOM = document.createElement('div');
    separatorDOM.classList.add('h5p-cornell-content-separator');

    return separatorDOM;
  }

  /**
   * Create DOM for main notes.
   * @return {HTMLElement} DOM for main notes.
   */
  createMainNotesDOM() {
    const mainNotesDOM = document.createElement('div');
    mainNotesDOM.classList.add('h5p-cornell-main-notes-wrapper');

    // Recall area
    const recall = document.createElement('div');
    recall.classList.add('h5p-cornell-main-notes-recall-wrapper');

    this.recall = H5P.newRunnable(
      {
        params: {
          taskDescription: this.params.notesFields.recallTitle,
          placeholderText: Util.htmlDecode(this.params.notesFields.recallPlaceholder),
          inputFieldSize: this.params.fieldSizeNotes,
        },
        library: 'H5P.TextInputField 1.2',
        subContentId: H5P.createUUID()
      },
      this.contentId,
      H5P.jQuery(recall),
      false,
      {previousState: this.previousState.recall}
    );

    mainNotesDOM.appendChild(recall);

    // Notes area
    const notes = document.createElement('div');
    notes.classList.add('h5p-cornell-main-notes-notes-wrapper');

    this.mainNotes = H5P.newRunnable(
      {
        params: {
          taskDescription: this.params.notesFields.notesTitle,
          placeholderText: Util.htmlDecode(this.params.notesFields.notesPlaceholder),
          inputFieldSize: this.params.fieldSizeNotes,
        },
        library: 'H5P.TextInputField 1.2',
        subContentId: H5P.createUUID()
      },
      this.contentId,
      H5P.jQuery(notes),
      false,
      {previousState: this.previousState.mainNotes}
    );

    mainNotesDOM.appendChild(notes);

    return mainNotesDOM;
  }

  /**
   * Create DOM for summary.
   * @return {HTMLElement} DOM for summary.
   */
  createSummaryDOM() {
    const summaryDOM = document.createElement('div');
    summaryDOM.classList.add('h5p-cornell-summary-wrapper');

    this.summary = H5P.newRunnable(
      {
        params: {
          taskDescription: this.params.notesFields.summaryTitle,
          placeholderText: Util.htmlDecode(this.params.notesFields.summaryPlaceholder),
          inputFieldSize: this.params.fieldSizeNotes,
        },
        library: 'H5P.TextInputField 1.2',
        subContentId: H5P.createUUID()
      },
      this.contentId,
      H5P.jQuery(summaryDOM),
      false,
      {previousState: this.previousState.summary}
    );

    return summaryDOM;
  }

  /**
   * Resize content.
   * @param {boolean} [fromVideo=false] If false, will trigger resize for exercise.
   */
  resize(fromVideo = false) {
    if (this.exercise && !fromVideo) {
      /*
       * In H5P.Video for YouTube, once wrapper width gets 0 it's locked. We
       * need to set excercise wrapper width = 0 however for shrinking. Fixed here.
       */
      if (this.youtubeWrapper) {
        this.youtubeWrapper.style.width = '100%';
      }

      setTimeout(() => {
        this.exercise.trigger('resize');
      }, 0);
    }

    // Not done using media query because display needs to be not-none first
    if (this.content.offsetWidth < this.params.minWidthForDualView) {
      // Only want to trigger toggleMedium once when mode actually changes
      if (!this.isNarrowScreen) {
        this.isNarrowScreen = true;

        // Triggers a transition, display set to none afterwards by listener
        this.exerciseWrapper.classList.add('h5p-cornell-narrow-screen');
        if (!this.isExerciseMode) {
          this.toggleMedium();
        }
      }
    }
    else {
      this.exerciseWrapper.classList.remove('h5p-cornell-display-none');
      setTimeout(() => {
        this.exerciseWrapper.classList.remove('h5p-cornell-narrow-screen');
      }, 0);

      // Only want to trigger toggleMedium once when mode actually changes
      if (this.isNarrowScreen) {
        this.isNarrowScreen = false;

        if (!this.isExerciseMode) {
          this.toggleMedium();
        }
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
   * @param {boolean} enterFullScreen If true, enter fullscreen, else exit.
   */
  toggleFullscreen(enterFullScreen = false) {
    this.titlebar.toggleFullscreenButton(enterFullScreen);

    if (enterFullScreen === true) {
      // Give browser some time to go to fullscreen mode and return proper viewport height
      setTimeout(() => {
        const maxHeight = `${window.innerHeight - this.titlebar.getDOM().offsetHeight}px`;
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
   * @param {object} event Event that is calling.
   */
  handleButtonToggle(event) {
    if (event && event.type === 'keypress' && event.keyCode !== 13 && event.keyCode !== 32) {
      return;
    }

    const active = this.titlebar.getToggleButtonState();
    if (typeof this.callbacks.read === 'function') {
      const message = (active) ?
        this.params.a11y.notesOpened :
        this.params.a11y.notesClosed;
      this.callbacks.read(Util.stripHTML(message));
    }

    this.toggleView();
    if (this.isNarrowScreen) {
      this.toggleMedium();
    }
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
   * Pause/replay medium depending on previous state.
   */
  toggleMedium() {
    let currentExercise;
    let currentMediumRunning;

    switch (this.exerciseMachineName) {
      // Not sure if it makes sense to stop audio as well
      // case 'H5P.Audio':
      //   currentExercise = this.exercise.audio;
      //   currentMediumRunning = this.exercise.audio.paused === false;
      //   break;

      case 'H5P.Video':
        currentExercise = this.exercise;
        currentMediumRunning = this.mediumRunning;
        break;
    }

    if (!currentExercise) {
      return;
    }

    if (currentMediumRunning) {
      this.continueMedia = currentMediumRunning;
      if (currentExercise.pause) {
        currentExercise.pause();
      }
    }
    else if (this.continueMedia === true) {
      this.continueMedia = undefined;
      if (currentExercise.play) {
        currentExercise.play();
      }
    }
  }

  /**
   * Strip tags from text in H5P TextInputField object. Don't want those here.
   * @param {object} fieldState Save state object to be cleaned.
   * @return {object} Save state object with cleaned text.
   */
  stripTags(fieldState) {
    fieldState.inputField = Util.htmlDecode(fieldState.inputField);
    return fieldState;
  }

  /**
   * Detect if some answer was given.
   * @return {boolean} True if some notes was typed.
   */
  getAnswerGiven() {
    return (this.recall.getInput().value.length + this.mainNotes.getInput().value.length + this.summary.getInput().value.length) > 0;
  }

  /**
   * Reset notes.
   */
  resetNotes() {
    this.recall.setState({});
    this.mainNotes.setState({});
    this.summary.setState({});
  }

  /**
   * Get current state to be saved.
   */
  getCurrentState() {
    return {
      dateString: this.previousState.dateString,
      recall: this.stripTags(this.recall.getCurrentState()),
      mainNotes: this.stripTags(this.mainNotes.getCurrentState()),
      summary: this.stripTags(this.summary.getCurrentState()),
      exercise: (this.exercise && this.exercise.getCurrentState) ? this.exercise.getCurrentState() : undefined
    };
  }

  /**
   * Save current state. Could be triggered indirectly by emitting an xAPI
   * 'progressed' statement, but this would include a 3 second delay.
   */
  handleSave() {
    // Using callback to also store in LocalStorage
    H5P.setUserData(
      this.contentId,
      'state',
      this.callbacks.getCurrentState(),
      { deleteOnChange: false }
    );

    if (this.buttonSave) {
      H5P.attachToastTo(this.buttonSave, this.params.l10n.notesSaved, {position: {
        horizontal: 'centered',
        noOverflowRight: true,
        offsetVertical: 5,
        vertical: 'above'
      }});
    }

    this.callbacks.read(this.params.a11y.notesSaved);
  }

  /**
   * Handle copy button
   */
  handleCopy() {
    const notes = (this.stripTags(this.mainNotes.getCurrentState())).inputField;
    const cue = (this.stripTags(this.recall.getCurrentState())).inputField;
    const summary = (this.stripTags(this.summary.getCurrentState()).inputField);

    const text = `## ${this.params.notesFields.notesTitle}\n${notes}\n\n## ${this.params.notesFields.recallTitle}\n${cue}\n\n## ${this.params.notesFields.summaryTitle}\n${summary}`;
    Util.copyTextToClipboard(text, (result) => {
      const message = (result === true) ? this.params.l10n.copyToClipboardSuccess : this.params.l10n.copyToClipboardError;

      H5P.attachToastTo(this.buttonCopy, message, {position: {
        horizontal: 'centered',
        noOverflowRight: true,
        offsetVertical: 5,
        vertical: 'above'
      }});

      this.callbacks.read(message);
    });
  }
}

/** @constant {number} */
CornellContent.MODE_EXERCISE = 0;

/** @constant {number} */
CornellContent.MODE_NOTES = 1;
