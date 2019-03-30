// Import required classes
import Util from './h5p-cornell-util';

/** Class representing the content */
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

    // TODO: Put this in separate function
    this.content = document.createElement('div');
    this.content.classList.add('h5p-cornell-container');

    // Create DOM elements
    this.content.appendChild(this.createTitleBarDOM());

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
        H5P.jQuery(exerciseContentLibrary)
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

    // Cornell Notes
    this.notesWrapper = document.createElement('div');
    this.notesWrapper.classList.add('h5p-cornell-notes-wrapper');

    const notesContentWrapper = document.createElement('div');
    notesContentWrapper.classList.add('h5p-cornell-notes-content-wrapper');

    this.notesWrapper.appendChild(notesContentWrapper);

    notesContentWrapper.appendChild(this.createMainNotesDOM());
    notesContentWrapper.appendChild(this.createSummaryDOM());

    this.content.append(this.notesWrapper);
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
   * Create DOM for title bar.
   * @return {HTMLElement} DOM for title bar.
   */
  createTitleBarDOM() {
    this.titleBar = document.createElement('div');
    this.titleBar.classList.add('h5p-cornell-title-bar');

    // TODO: Take care of ARIA for button state
    this.buttonOverlay = document.createElement('div');
    this.buttonOverlay.classList.add('h5p-cornell-button-overlay');
    this.buttonOverlay.setAttribute('role', 'button');
    this.buttonOverlay.setAttribute('tabindex', '0');

    // TODO: event listener for keys
    this.buttonOverlay.addEventListener('click', () => {
      this.buttonOverlay.classList.toggle('h5p-cornell-active');
      this.exerciseWrapper.classList.toggle('h5p-cornell-notes-mode');
      this.notesWrapper.classList.toggle('h5p-cornell-notes-mode');

      // Pause/replay media when toggling notes
      switch(this.exerciseMachineName) {
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

      this.isExerciseMode = !this.isExerciseMode;

      this.resize();
    });

    const titleDOM = document.createElement('div');
    titleDOM.classList.add('h5p-cornell-title');
    titleDOM.innerHTML = this.extras.metadata.title;

    const dateDOM = document.createElement('div');
    dateDOM.classList.add('h5p-cornell-date');
    dateDOM.innerHTML = this.previousState.dateString;

    this.titleBar.appendChild(this.buttonOverlay);
    this.titleBar.appendChild(titleDOM);
    this.titleBar.appendChild(dateDOM);

    return this.titleBar;
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
    this.recall = H5P.newRunnable({
      library: 'H5P.TextInputField 1.2',
      params: {
        taskDescription: this.params.notesFields.recallTitle,
        placeholderText: this.params.notesFields.recallPlaceholder,
        inputFieldSize: this.params.fieldSizeNotes,
      }
    }, this.contentId, H5P.jQuery(recall), undefined, {previousState: this.previousState.recall});
    mainNotesDOM.appendChild(recall);

    // Notes area
    const notes = document.createElement('div');
    notes.classList.add('h5p-cornell-main-notes-notes-wrapper');
    this.mainNotes = H5P.newRunnable({
      library: 'H5P.TextInputField 1.2',
      params: {
        taskDescription: this.params.notesFields.notesTitle,
        placeholderText: this.params.notesFields.notesPlaceholder,
        inputFieldSize: this.params.fieldSizeNotes,
      }
    }, this.contentId, H5P.jQuery(notes), undefined, {previousState: this.previousState.mainNotes});
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

    this.summary = H5P.newRunnable({
      library: 'H5P.TextInputField 1.2',
      params: {
        taskDescription: this.params.notesFields.summaryTitle,
        placeholderText: this.params.notesFields.summaryPlaceholder,
        inputFieldSize: this.params.fieldSizeSummary,
      }
    }, this.contentId, H5P.jQuery(summaryDOM), undefined, {previousState: this.previousState.summary});

    return summaryDOM;
  }

  /**
   * Resize content.
   */
  resize(fromVideo = false) {
    if (this.exercise && !fromVideo) {
      this.exercise.trigger('resize');
    }

    const height = this.titleBar.offsetHeight + (this.isExerciseMode ? this.exerciseWrapper.offsetHeight : this.notesWrapper.offsetHeight);
    this.content.style.height = `${height}px`;

    if (typeof this.callbacks.resize === 'function') {
      this.callbacks.resize();
    }
  }

  /**
   * Set dimensions to fullscreen.
   * @param {boolean} on If true, enter fullscreen, else exit.
   */
  setFullScreen(on = false) {
    if (on === true) {
      this.exerciseWrapper.style.maxHeight = `${screen.height - this.titleBar.offsetHeight}px`;
      this.notesWrapper.style.maxHeight = `${screen.height - this.titleBar.offsetHeight}px`;
    }
    else {
      this.exerciseWrapper.style.maxHeight = '';
      this.notesWrapper.style.maxHeight = '';
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
   * Get current state to be saved.
   */
  getCurrentState() {
    return {
      dateString: this.previousState.dateString,
      recall: this.stripTags(this.recall.getCurrentState()),
      mainNotes: this.stripTags(this.mainNotes.getCurrentState()),
      summary: this.stripTags(this.summary.getCurrentState())
    };
  }
}
