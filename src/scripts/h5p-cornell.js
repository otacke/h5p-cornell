// Import required classes
import CornellContent from './h5p-cornell-content';
import Util from './h5p-cornell-util';

/** Class representing Cornell Notes */
export default class Cornell extends H5P.Question {
  /**
   * @constructor
   *
   * @param {object} params Parameters passed by the editor.
   * @param {number} contentId Content's id.
   * @param {object} [extras={}] Saved state, metadata, etc.
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

    // Make sure all variables are set
    this.params = Util.extend({
      instructions: '',
      fieldSizeNotes: 10,
      fieldSizeSummary: 7,
      notesFields: {
        recallTitle: 'Recall',
        recallPlaceholder: 'Enter your keywords, questions, the main idea, etc.',
        notesTitle: 'Notes',
        notesPlaceholder: 'Enter dates, details, definitions, formulas, examples, etc.',
        summaryTitle: 'Summary',
        summaryPlaceholder: 'Enter your summary',
      },
      behaviour: {
        enableSolutionsButton: false,
        enableRetry: false
      },
      l10n: {
        submitAnswer: 'Submit'
      },
      a11y: {
        buttonFullscreenEnter: 'Enter fullscreen mode',
        buttonToggleSwitchNotes: 'Switch to the notes',
        buttonToggleSwitchExercise: 'Switch to the exercise',
        switchedNotes: 'The view switched to your notes.',
        switchedExercise: 'The view switched to the exercise.',
      }
    }, params);

    /*
     * The previousState stored inside the database will be set to undefined if
     * the author changes the exercise (eve if just correcting a typo). This
     * would erase all notes, so the localStorage value is used if the
     * previous state id undefined.
     */
    this.extras = Util.extend({
      metadata: {
        title: 'Cornell Notes',
      },
      previousState: Cornell.getPreviousStateLocal(this.contentId) || {}
    }, extras);

    document.addEventListener('readystatechange', () => {
      if (document.readyState === 'complete') {
        setTimeout(() => {
          // Add fullscreen button on first call after H5P.Question has created the DOM
          const container = document.querySelector('.h5p-container');
          if (container) {
            this.addFullScreenButton(container);
          }

          // Content may need one extra resize when DOM is displayed.
          this.content.resize();
        }, 0);
      }
    });

    /**
     * Register the DOM elements with H5P.Question
     */
    this.registerDomElements = () => {
      this.content = new CornellContent(this.params, this.contentId, this.extras, {
        resize: this.resize,
        read: this.read
      });

      // Register content with H5P.Question
      this.setContent(this.content.getDOM());
    };

    /**
     * Add fullscreen button.
     * @param {HTMLElement} wrapper HTMLElement to attach button to.
     */
    this.addFullScreenButton = wrapper => {
      if (H5P.canHasFullScreen !== true) {
        return;
      }

      const toggleFullScreen = (event) => {
        if (event && event.type === 'keypress' && event.keyCode !== 13 && event.keyCode !== 32) {
          return;
        }
        else {
          event.preventDefault();
        }

        if (H5P.isFullscreen === true) {
          H5P.exitFullScreen();
        }
        else {
          H5P.fullScreen(H5P.jQuery(wrapper), this);
        }
      };

      this.fullScreenButton = document.createElement('button');
      this.fullScreenButton.classList.add('h5p-cornell-fullscreen-button');
      this.fullScreenButton.classList.add('h5p-cornell-enter-fullscreen');
      this.fullScreenButton.setAttribute('title', this.params.a11y.buttonFullscreenEnter);
      this.fullScreenButton.setAttribute('aria-label', this.params.a11y.buttonFullscreenEnter);
      this.fullScreenButton.addEventListener('click', toggleFullScreen);
      this.fullScreenButton.addEventListener('keyPress', toggleFullScreen);

      this.on('enterFullScreen', () => {
        this.content.setFullScreen(true);
      });

      this.on('exitFullScreen', () => {
        this.content.setFullScreen(false);
      });

      const fullScreenButtonWrapper = document.createElement('div');
      fullScreenButtonWrapper.classList.add('h5p-cornell-fullscreen-button-wrapper');
      fullScreenButtonWrapper.appendChild(this.fullScreenButton);

      wrapper.insertBefore(fullScreenButtonWrapper, wrapper.firstChild);
    };

    /**
     * Check if result has been submitted or input has been given.
     * @return {boolean} True, if answer was given.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-1}
     */
    this.getAnswerGiven = () => this.content.getAnswerGiven();

    /**
     * Get latest score.
     * @return {number} latest score.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-2}
     */
    this.getScore = () => 0;

    /**
     * Get maximum possible score
     * @return {number} Score necessary for mastering.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-3}
     */
    this.getMaxScore = () => 0;

    /**
     * Show solutions.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-4}
     */
    this.showSolutions = () => {
    };

    /**
     * Reset task.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-5}
     */
    this.resetTask = () => {
      this.content.resetNotes();
    };

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

    /**
     * Resize.
     */
    this.resize = () => {
      this.trigger('resize', {break: true});
    };

    /**
     * Get xAPI data.
     * @return {object} XAPI statement.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-6}
     */
    this.getXAPIData = () => ({
      statement: this.getXAPIAnswerEvent().data.statement
    });

    /**
     * Build xAPI answer event.
     * @return {H5P.XAPIEvent} XAPI answer event.
     */
    this.getXAPIAnswerEvent = () => {
      const xAPIEvent = this.createXAPIEvent('answered');

      xAPIEvent.setScoredResult(this.getScore(), this.getMaxScore(), this, true, this.isPassed());

      return xAPIEvent;
    };

    /**
     * Create an xAPI event.
     * @param {string} verb Short id of the verb we want to trigger.
     * @return {H5P.XAPIEvent} Event template.
     */
    this.createXAPIEvent = (verb) => {
      const xAPIEvent = this.createXAPIEventTemplate(verb);
      Util.extend(
        xAPIEvent.getVerifiedStatementValue(['object', 'definition']),
        this.getxAPIDefinition());
      return xAPIEvent;
    };

    /**
     * Get the xAPI definition for the xAPI object.
     * @return {object} XAPI definition.
     */
    this.getxAPIDefinition = () => {
      const definition = {};
      definition.name = {'en-US': this.getTitle()};
      definition.description = {'en-US': this.getDescription()};
      definition.type = 'http://adlnet.gov/expapi/activities/cmi.interaction';
      definition.interactionType = 'long-fill-in';

      return definition;
    };

    /**
     * Determine whether the task has been passed by the user.
     * @return {boolean} True if user passed or task is not scored.
     */
    this.isPassed = () => true;

    /**
     * Get tasks title.
     * @return {string} Title.
     */
    this.getTitle = () => {
      let raw;
      if (this.extras.metadata) {
        raw = this.extras.metadata.title;
      }
      raw = raw || Cornell.DEFAULT_DESCRIPTION;

      return H5P.createTitle(raw);
    };

    /**
     * Get tasks description.
     * @return {string} Description.
     */
    this.getDescription = () => this.params.taskDescription || Cornell.DEFAULT_DESCRIPTION;

    /**
     * Answer call to return the current state.
     * @return {object} Current state.
     */
    this.getCurrentState = () => {
      const currentState = this.content.getCurrentState();

      // Use localStorage to avoid data loss on minor content changes
      if (window.localStorage) {
        window.localStorage.setItem(`${Cornell.DEFAULT_DESCRIPTION}-${this.contentId}`, JSON.stringify(currentState));
      }

      return currentState;
    };
  }

  /**
   * Get previous state from localStorage.
   * @param {number} id Content id to retrieve content for.
   * @return {object|null} Previous state, null if not possible.
   */
  static getPreviousStateLocal(id) {
    if (!window.localStorage || typeof id !== 'number') {
      return null;
    }

    let previousState = window.localStorage.getItem(`${Cornell.DEFAULT_DESCRIPTION}-${id}`);

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
