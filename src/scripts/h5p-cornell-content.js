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

    this.isExerciseMode = true;

    this.content = document.createElement('div');
    this.content.classList.add('h5p-cornell-container');

    this.titlebar = this.createTitleBar();
    this.content.appendChild(this.titlebar.getDOM());

    this.appendExercise();
    this.appendNotes();
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
        a11y: {
          buttonToggleActive: this.params.a11y.buttonToggleSwitchExercise,
          buttonToggleInactive: this.params.a11y.buttonToggleSwitchNotes
        }
      },
      {
        handlebuttonToggle: (event) => this.handlebuttonToggle(event)
      }
    );
  }

  /**
   * Append exercise.
   */
  appendExercise() {
    // Exercise with H5P Content
    this.exerciseWrapper = document.createElement('div');
    this.exerciseWrapper.classList.add('h5p-cornell-exercise-wrapper');

    const exerciseContent = document.createElement('div');
    exerciseContent.classList.add('h5p-cornell-exercise-content');
    exerciseContent.appendChild(this.createInstructionsDOM());

    const exerciseContentLibrary = document.createElement('div');
    exerciseContentLibrary.classList.add('h5p-cornell-exercise-content-library');
    exerciseContent.appendChild(exerciseContentLibrary);

    const exerciseContentWrapper = document.createElement('div');
    exerciseContentWrapper.classList.add('h5p-cornell-exercise-content-wrapper');
    exerciseContentWrapper.appendChild(exerciseContent);

    this.exerciseWrapper.appendChild(exerciseContentWrapper);

    // TODO: Make next stuff separate functions
    if (this.params.exerciseContent && this.params.exerciseContent.library) {
      this.exerciseMachineName = this.params.exerciseContent.library.split(' ')[0];
    }

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
          break;
        case 'H5P.Video':
          // H5P.Video doesn't keep track of its playing state itself
          this.exercise.on('stateChange', (event) => {
            this.mediumRunning = (event.data === 1);
          });

          this.exercise.on('resize', () => {
            this.resize(true);
          });

          break;
      }
    }
    else {
      const message = document.createElement('div');
      const messageText = 'No content was chosen for this exercise';
      console.warn(messageText);
      message.innerHTML = messageText;
      exerciseContentLibrary.appendChild(message);
    }

    this.content.append(this.exerciseWrapper);
  }

  /**
   * Append notes.
   */
  appendNotes() {
    // Cornell Notes
    this.notesWrapper = document.createElement('div');
    this.notesWrapper.classList.add('h5p-cornell-notes-wrapper');

    // Hide wrapper after it has been moved out of sight to prevent receiving tab focus
    this.notesWrapper.addEventListener('transitionend', () => {
      const elementToHide = (this.isExerciseMode) ? this.notesWrapper : this.exerciseWrapper;
      elementToHide.classList.add('h5p-cornell-display-none');
    });

    const notesContentWrapper = document.createElement('div');
    notesContentWrapper.classList.add('h5p-cornell-notes-content-wrapper');

    this.notesWrapper.appendChild(notesContentWrapper);

    notesContentWrapper.appendChild(this.createMainNotesDOM());
    notesContentWrapper.appendChild(this.createSummaryDOM());

    this.content.append(this.notesWrapper);
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
   * Create DOM for main notes.
   * @return {HTMLElement} DOM for main notes.
   */
  createMainNotesDOM() {
    const mainNotesDOM = document.createElement('div');
    mainNotesDOM.classList.add('h5p-cornell-main-notes-wrapper');

    // Recall area
    const recall = document.createElement('div');
    recall.classList.add('h5p-cornell-main-notes-recall-wrapper');

    this.recall = new H5P.TextInputField(
      {
        taskDescription: this.params.notesFields.recallTitle,
        placeholderText: this.params.notesFields.recallPlaceholder,
        inputFieldSize: this.params.fieldSizeNotes,
      },
      this.contentId,
      {previousState: this.previousState.recall}
    );
    this.recall.attach(H5P.jQuery(recall));

    mainNotesDOM.appendChild(recall);

    // Notes area
    const notes = document.createElement('div');
    notes.classList.add('h5p-cornell-main-notes-notes-wrapper');

    this.mainNotes = new H5P.TextInputField(
      {
        taskDescription: this.params.notesFields.notesTitle,
        placeholderText: this.params.notesFields.notesPlaceholder,
        inputFieldSize: this.params.fieldSizeNotes,
      },
      this.contentId,
      {previousState: this.previousState.mainNotes}
    );
    this.mainNotes.attach(H5P.jQuery(notes));

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

    this.summary = new H5P.TextInputField(
      {
        taskDescription: this.params.notesFields.summaryTitle,
        placeholderText: this.params.notesFields.summaryPlaceholder,
        inputFieldSize: this.params.fieldSizeSummary,
      },
      this.contentId,
      {previousState: this.previousState.summary}
    );
    this.summary.attach(H5P.jQuery(summaryDOM));

    return summaryDOM;
  }

  /**
   * Resize content.
   * @param {boolean} [fromVideo=false] If false, will trigger resize for exercise.
   */
  resize(fromVideo = false) {
    if (this.exercise && !fromVideo) {
      this.exercise.trigger('resize');
    }

    const height = this.titlebar.getDOM().offsetHeight + (this.isExerciseMode ? this.exerciseWrapper.offsetHeight : this.notesWrapper.offsetHeight);
    this.content.style.height = `${height}px`;

    if (typeof this.callbacks.resize === 'function') {
      this.callbacks.resize();
    }
  }

  /**
   * Set dimensions to fullscreen.
   * @param {boolean} enterFullScreen If true, enter fullscreen, else exit.
   */
  setFullScreen(enterFullScreen = false) {
    if (enterFullScreen === true) {
      this.exerciseWrapper.style.maxHeight = `${screen.height - this.titlebar.getDOM().offsetHeight}px`;
      this.notesWrapper.style.maxHeight = `${screen.height - this.titlebar.getDOM().offsetHeight}px`;
    }
    else {
      this.exerciseWrapper.style.maxHeight = '';
      this.notesWrapper.style.maxHeight = '';
    }
  }

  /**
   * Handle activation of overlay button.
   * @param {object} event Event that is calling.
   */
  handlebuttonToggle(event) {
    if (event && event.type === 'keypress' && event.keyCode !== 13 && event.keyCode !== 32) {
      return;
    }

    const active = this.titlebar.toggleOverlayButton();
    if (typeof this.callbacks.read === 'function') {
      const message = (active) ?
        this.params.a11y.switchedNotes :
        this.params.a11y.switchedExercise;
      this.callbacks.read(message);
    }

    this.toggleView();
    this.toggleMedium();
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
   * Pause/replay medium when toggling between exercise and notes.
   */
  toggleMedium() {
    switch (this.exerciseMachineName) {
      case 'H5P.Audio':
        if (this.isExerciseMode && this.exercise.audio) {
          this.continueMedia = this.exercise.audio.paused === false;
          this.exercise.audio.pause();
        }
        else {
          if (this.exercise.audio && this.continueMedia === true) {
            this.exercise.audio.play();
          }
        }
        break;
      case 'H5P.Video':
        if (this.isExerciseMode && this.exercise) {
          this.continueMedia = this.mediumRunning;
          this.exercise.pause();
        }
        else {
          if (this.exercise && this.continueMedia === true) {
            this.exercise.play();
          }
        }
        break;
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
}
