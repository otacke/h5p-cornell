// Import required classes
import Util from './h5p-cornell-util';

/** Class representing the content */
export default class CornellContent {
  /**
   * @constructor
   *
   * @param {object} textField Parameter from editor.
   * @param {number} contentId Content ID.
   * @param {object} [previousState] PreviousState.
   */
  constructor(params, contentId, previousState) {
    this.params = params;
    this.contentId = contentId;

    // Create values to fill with
    this.previousState = Util.extend(
      {
        title: this.params.title,
        dateString: new Date().toLocaleDateString(),
        recall: {inputField: ''},
        mainNotes: {inputField: ''},
        summary: {inputField: ''}
      },
      previousState || {}
    );

    this.content = document.createElement('div');
    this.content.classList.add('h5p-cornell-container');

    // Create DOM elements
    this.content.appendChild(this.createInstructionsDOM());
    this.content.appendChild(this.createHeadlineDOM());
    this.content.appendChild(this.createMainNotesDOM());
    this.content.appendChild(this.createSummaryDOM());
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
   * Create DOM for headline.
   * @return {HTMLElement} DOM for headline.
   */
  createHeadlineDOM() {
    const headlineDOM = document.createElement('div');
    headlineDOM.classList.add('h5p-cornell-headline-wrapper');

    const titleDOM = document.createElement('div');
    titleDOM.classList.add('h5p-cornell-headline-title-wrapper');

    const titleLabel = document.createElement('div');
    titleLabel.classList.add('h5p-cornell-headline-title-label');
    titleLabel.innerHTML = this.params.l10n.title;
    titleDOM.appendChild(titleLabel);

    this.titleInputField = document.createElement('input');
    this.titleInputField.classList.add('h5p-cornell-headline-title-input-field');
    this.titleInputField.setAttribute('type', 'text');
    this.titleInputField.setAttribute('name', 'cornell-title');
    this.titleInputField.setAttribute('maxlength', '100');
    this.titleInputField.setAttribute('value', this.previousState.title);
    if (this.params.titleDisabled) {
      this.titleInputField.setAttribute('disabled', 'disabled');
    }
    titleDOM.appendChild(this.titleInputField);
    headlineDOM.appendChild(titleDOM);

    const dateDOM = document.createElement('div');
    dateDOM.classList.add('h5p-cornell-headline-date-wrapper');

    const dateLabel = document.createElement('div');
    dateLabel.classList.add('h5p-cornell-headline-date-label');
    dateLabel.innerHTML = this.params.l10n.date;
    dateDOM.appendChild(dateLabel);

    const dateField = document.createElement('div');
    dateField.classList.add('h5p-cornell-headline-date-field');
    dateField.innerHTML = this.previousState.dateString;
    dateDOM.appendChild(dateField);

    headlineDOM.appendChild(dateDOM);

    return headlineDOM;
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
        taskDescription: this.params.recallTitle,
        placeholderText: this.params.recallPlaceholder,
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
        taskDescription: this.params.notesTitle,
        placeholderText: this.params.notesPlaceholder,
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
        taskDescription: this.params.summaryTitle,
        placeholderText: this.params.summarPlaceholder,
        inputFieldSize: this.params.fieldSizeSummary,
      }
    }, this.contentId, H5P.jQuery(summaryDOM), undefined, {previousState: this.previousState.summary});

    return summaryDOM;
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
      title: Util.htmlDecode(this.titleInputField.value),
      dateString: this.previousState.dateString,
      recall: this.stripTags(this.recall.getCurrentState()),
      mainNotes: this.stripTags(this.mainNotes.getCurrentState()),
      summary: this.stripTags(this.summary.getCurrentState())
    };
  }
}
