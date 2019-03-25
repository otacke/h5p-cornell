// Import required classes
import Util from './h5p-cornell-util';

/** Class representing the content */
export default class CornellContent {
  /**
   * @constructor
   *
   * @param {string} textField Parameter from editor.
   * @param {string} [username=world] Username.
   * @param {number} [random=-1] Random number.
   */
  constructor(params, contentId, previousState) {
    this.params = params;
    this.contentId = contentId;

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

    // TODO: Rename functions/variables to reflect DOM
    this.content.appendChild(this.createInstructions());
    this.content.appendChild(this.createHeadline());
    this.content.appendChild(this.createMainNotes());
    this.content.appendChild(this.createSummary());
  }

  /**
   * Return the DOM for this class.
   *
   * @return {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.content;
  }

  createInstructions() {
    const instructionsDOM = document.createElement('div');

    if (this.params.instructions !== '') {
      instructionsDOM.classList.add('h5p-cornell-instructions-wrapper');
      instructionsDOM.innerHTML = this.params.instructions;
    }

    return instructionsDOM;
  }

  createHeadline() {
    const headlineDOM = document.createElement('div');
    headlineDOM.classList.add('h5p-cornell-headline-wrapper');

    const titleDOM = document.createElement('div');
    titleDOM.classList.add('h5p-cornell-headline-title-wrapper');

    const titleLabel = document.createElement('div');
    titleLabel.classList.add('h5p-cornell-headline-title-label');
    titleLabel.innerHTML = this.params.l10n.title;
    titleDOM.appendChild(titleLabel);

    // TODO: Rename inputField
    this.inputField = document.createElement('input');
    this.inputField.classList.add('h5p-cornell-headline-title-input-field');
    this.inputField.setAttribute('type', 'text');
    this.inputField.setAttribute('name', 'cornell-title');
    this.inputField.setAttribute('maxlength', '100');
    this.inputField.setAttribute('value', this.previousState.title);
    if (this.params.titleDisabled) {
      this.inputField.setAttribute('disabled', 'disabled');
    }
    titleDOM.appendChild(this.inputField);
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

  createMainNotes() {
    const mainNotes = document.createElement('div');
    mainNotes.classList.add('h5p-cornell-main-notes-wrapper');

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
    mainNotes.appendChild(recall);

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
    mainNotes.appendChild(notes);

    return mainNotes;
  }

  createSummary() {
    const summary = document.createElement('div');
    summary.classList.add('h5p-cornell-summary-wrapper');

    this.summary = H5P.newRunnable({
      library: 'H5P.TextInputField 1.2',
      params: {
        taskDescription: this.params.summaryTitle,
        placeholderText: this.params.summarPlaceholder,
        inputFieldSize: this.params.fieldSizeSummary,
      }
    }, this.contentId, H5P.jQuery(summary), undefined, {previousState: this.previousState.summary});

    return summary;
  }

  stripTags(fieldState) {
    fieldState.inputField = Util.htmlDecode(fieldState.inputField);
    return fieldState;
  }

  getCurrentState() {
    return {
      title: Util.htmlDecode(this.inputField.value),
      dateString: this.previousState.dateString,
      recall: this.stripTags(this.recall.getCurrentState()),
      mainNotes: this.stripTags(this.mainNotes.getCurrentState()),
      summary: this.stripTags(this.summary.getCurrentState())
    };
  }
}
