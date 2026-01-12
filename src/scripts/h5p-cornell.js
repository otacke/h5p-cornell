// Import required classes
import CornellContent from './h5p-cornell-content.js';
import Dictionary from '@services/dictionary.js';
import { getSemanticsDefaults } from '@services/util-h5p.js';
import { extend, formatLanguageCode } from './services/util.js';

/** Class representing Cornell Notes */
export default class Cornell extends H5P.Question {
  /**
   * @class
   * @param {object} params Parameters passed by the editor.
   * @param {number} contentId Content's id.
   * @param {object} [extras] Saved state, metadata, etc.
   */
  constructor(params, contentId, extras = {}) {
    super('cornell'); // CSS class selector for content's iframe: h5p-cornell

    this.contentId = contentId;

    /*
     * this.params.behaviour.enableSolutionsButton and this.params.behaviour.enableRetry
     * are used by H5P's question type contract.
     * @see {@link https://h5p.org/documentation/developers/contracts#guides-header-8}
     * @see {@link https://h5p.org/documentation/developers/contracts#guides-header-9}
     */
    const defaults = extend(
      {
        fieldSizeNotes: 10,
        fieldSizeSummary: 7,
        behaviour: {
          enableSolutionsButton: false,
          enableRetry: false,
          showNotesOnStartup: params.behaviour === true,
        }
      },
      getSemanticsDefaults(),
    );
    this.params = extend(defaults, params);

    Dictionary.fill({ l10n: this.params.l10n, a11y: this.params.a11y });

    /*
     * The previousState stored inside the database will be set to undefined if
     * the author changes the exercise (even if just correcting a typo). This
     * would erase all notes, so the localStorage value is used if the
     * previous state id undefined.
     */
    this.extras = extend({
      metadata: {
        title: 'Cornell Notes',
      },
      previousState: Cornell.getPreviousStateLocal(
        this.isRoot() ? this.contentId : this.subContentId,
      ) || {},
    }, extras);

    const defaultLanguage = this.extras.metadata.defaultLanguage || 'en';
    this.languageTag = formatLanguageCode(defaultLanguage);
  }

  /**
   * Handle content visible.
   */
  handleContentVisible() {
    setTimeout(() => {
      // Add fullscreen button on first call after H5P.Question has created DOM
      this.container = document.querySelector('.h5p-container');
      if (this.container && this.isRoot() && H5P.fullscreenSupported) {
        this.content.enableFullscreenButton();

        this.on('enterFullScreen', () => {
          this.content.toggleFullscreen(true);
        });

        this.on('exitFullScreen', () => {
          this.content.toggleFullscreen(false);
        });
      }

      // Content may need one extra resize when DOM is displayed.
      this.content.resize();
    }, 0);
  }

  /**
   * Register the DOM elements with H5P.Question
   */
  registerDomElements() {
    // On desktop, notes might be wanted to be open on startup
    this.params.behaviour.showNotesOnStartup = this.params.behaviour.showNotesOnStartup &&
      document.querySelector('.h5p-container').offsetWidth >= Cornell.MIN_WIDTH_FOR_DUALVIEW;

    this.content = new CornellContent({
      behaviour: this.params.behaviour,
      contentId: this.contentId,
      exerciseContent: this.params.exerciseContent,
      extras: this.extras,
      fieldSizeNotes: this.params.fieldSizeNotes,
      headline: this.params.headline,
      instructions: this.params.instructions,
      isRoot: this.isRoot(),
      notesFields: this.params.notesFields,
    },
    {
      resize: () => {
        this.resize();
      },
      read: (text) => {
        this.read(text);
      },
      onButtonFullscreen: (state) => {
        this.toggleFullscreen(state);
      },
      getCurrentState: () => {
        return this.getCurrentState();
      },
    });

    // Register content with H5P.Question
    this.setContent(this.content.getDOM());

    // Wait for content to be attached to DOM
    this.observer = new IntersectionObserver((entries) => {
      if (entries[0].intersectionRatio === 1) {
        this.observer.unobserve(this.content.getDOM()); // Only needed once
        this.handleContentVisible();
      }
    }, {
      root: document.documentElement,
      threshold: [1],
    });
    this.observer.observe(this.content.getDOM());

    /**
     * Resize Listener.
     */
    this.on('resize', (event) => {
      // Initial resizing of content after DOM is ready.
      if (event.data && event.data.break === true) {
        return;
      }

      this.content.resize();
    });
  }

  /**
   * Toggle fullscreen button.
   * @param {string|boolean} state enter|false for enter, exit|true for exit.
   */
  toggleFullscreen(state) {
    if (!this.container) {
      return;
    }

    if (typeof state === 'string') {
      if (state === 'enter') {
        state = false;
      }
      else if (state === 'exit') {
        state = true;
      }
    }

    if (typeof state !== 'boolean') {
      state = !H5P.isFullscreen;
    }

    if (state === true) {
      H5P.fullScreen(H5P.jQuery(this.container), this);
    }
    else {
      H5P.exitFullScreen();
    }
  }

  /**
   * Check if result has been submitted or input has been given.
   * @returns {boolean} True, if answer was given.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-1}
   */
  getAnswerGiven() {
    return this.content.getAnswerGiven();
  }

  /**
   * Get latest score.
   * @returns {number} latest score.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-2}
   */
  getScore() {
    return 0;
  }

  /**
   * Get maximum possible score
   * @returns {number} Score necessary for mastering.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-3}
   */
  getMaxScore() {
    return 0;
  }

  /**
   * Show solutions.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-4}
   */
  showSolutions() {}

  /**
   * Reset task.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-5}
   */
  resetTask() {
    this.contentWasReset = true;
    this.content.resetNotes();
  }

  /**
   * Resize.
   */
  resize() {
    this.trigger('resize', { break: true });
  }

  /**
   * Get xAPI data.
   * @returns {object} XAPI statement.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-6}
   */
  getXAPIData() {
    return {
      statement: this.getXAPIAnswerEvent().data.statement,
    };
  }

  /**
   * Build xAPI answer event.
   * @returns {H5P.XAPIEvent} XAPI answer event.
   */
  getXAPIAnswerEvent() {
    const xAPIEvent = this.createXAPIEvent('answered');

    xAPIEvent.setScoredResult(this.getScore(), this.getMaxScore(),
      this, true, this.isPassed());

    return xAPIEvent;
  }

  /**
   * Create an xAPI event.
   * @param {string} verb Short id of the verb we want to trigger.
   * @returns {H5P.XAPIEvent} Event template.
   */
  createXAPIEvent(verb) {
    const xAPIEvent = this.createXAPIEventTemplate(verb);
    extend(
      xAPIEvent.getVerifiedStatementValue(['object', 'definition']),
      this.getxAPIDefinition());
    return xAPIEvent;
  }

  /**
   * Get the xAPI definition for the xAPI object.
   * @returns {object} XAPI definition.
   */
  getxAPIDefinition() {
    const definition = {};
    definition.name = {};
    definition.name[this.languageTag] = this.getTitle();
    // Fallback for h5p-php-reporting, expects en-US
    definition.name['en-US'] = definition.name[this.languageTag];
    definition.description = {};
    definition.description[this.languageTag] = this.getDescription();
    // Fallback for h5p-php-reporting, expects en-US
    definition.description['en-US'] = definition.description[this.languageTag];
    definition.type = 'http://adlnet.gov/expapi/activities/cmi.interaction';
    definition.interactionType = 'long-fill-in';

    return definition;
  }

  /**
   * Determine whether the task has been passed by the user.
   * @returns {boolean} True if user passed or task is not scored.
   */
  isPassed() {
    return true;
  }

  /**
   * Get tasks title.
   * @returns {string} Title.
   */
  getTitle() {
    let raw;
    if (this.extras.metadata) {
      raw = this.extras.metadata.title;
    }
    raw = raw || Cornell.DEFAULT_DESCRIPTION;

    return H5P.createTitle(raw);
  }

  /**
   * Get tasks description.
   * @returns {string} Description.
   */
  getDescription() {
    return this.params.taskDescription || Cornell.DEFAULT_DESCRIPTION;
  }

  /**
   * Answer call to return the current state.
   * @returns {object} Current state.
   */
  getCurrentState() {
    if (!this.getAnswerGiven()) {
      // Nothing relevant to store, but previous state in DB must be cleared after reset
      return this.contentWasReset ? {} : undefined;
    }

    const currentState = this.content.getCurrentState();

    // Use localStorage to avoid data loss on minor content changes
    try {
      if (window.localStorage) {
        const id = this.isRoot() ? this.contentId : this.subContentId;
        window.localStorage.setItem(
          `${Cornell.DEFAULT_DESCRIPTION}-${id}`,
          JSON.stringify(currentState),
        );
      }
    }
    catch (error) {
      console.warn('Could not store localStorage content for previous state.');
    }

    return currentState;
  }

  /**
   * Get previous state from localStorage.
   * @param {number} id Content id to retrieve content for.
   * @returns {object|null} Previous state, null if not possible.
   */
  static getPreviousStateLocal(id) {
    try {
      if (!window.localStorage || typeof id !== 'number') {
        return null;
      }
    }
    catch (error) {
      console.warn('Could not access localStorage content for previous state.');
      return null;
    }

    let previousState = window.localStorage.getItem(
      `${Cornell.DEFAULT_DESCRIPTION}-${id}`,
    );

    if (previousState) {
      try {
        previousState = JSON.parse(previousState);
      }
      catch (error) {
        console.warn('Could not parse localStorage content for previous state.');
        previousState = null;
      }
    }

    return previousState;
  }
}

/** @constant {string} */
Cornell.DEFAULT_DESCRIPTION = 'Cornell Notes';
