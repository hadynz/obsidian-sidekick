import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/rangeset';
import { debounce, Debouncer } from 'obsidian';
import { findAll, Chunk } from 'highlight-words-core';
import tippy, { Tippy, Instance } from 'tippy.js';

import 'tippy.js/dist/tippy.css';

const SuggestionCandidateClass = 'cm-suggestion-candidate';

const squigglyUnderline = (chunk: Chunk) =>
  Decoration.mark({
    class: SuggestionCandidateClass,
    attributes: {
      'data-position-start': `${chunk.start}`,
      'data-position-end': `${chunk.end}`,
    },
  });

export type SearchWords = {
  [key: string]: 'tag' | 'link';
};

let tippyInstance: Instance;

export const matchHighlighter = (searchWords: SearchWords) => {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      delayedDecorateView: Debouncer<[view: EditorView]>;

      constructor(view: EditorView) {
        console.log('constructor running');

        this.updateDebouncer(view);
        this.decorations = this.decorateView(view);
      }

      public update(update: ViewUpdate): void {
        if (update.docChanged) {
          this.delayedDecorateView(update.view);
        }
      }

      private updateDebouncer(_view: EditorView) {
        this.delayedDecorateView = debounce(
          (view: EditorView) => {
            this.decorations = this.decorateView(view);
            view.update([]); // force a view update so that the decorations we just set get applied
          },
          1000,
          true
        );
      }

      decorateView(view: EditorView): DecorationSet {
        const builder = new RangeSetBuilder<Decoration>();

        const textToHighlight = view.state.doc.slice(0).toJSON().join('\n');

        const chunks = findAll({ searchWords: Object.keys(searchWords), textToHighlight })
          .filter((chunk) => chunk.highlight)
          .filter((chunk) => view.state.doc.sliceString(chunk.start - 1, chunk.start) !== '#');

        for (const chunk of chunks) {
          builder.add(chunk.start, chunk.end, squigglyUnderline(chunk));
        }

        console.log('render suggestions');

        return builder.finish();
      }
    },
    {
      decorations: (view) => view.decorations,

      eventHandlers: {
        mousedown: (e, view) => {
          const target = e.target as HTMLElement;
          const isCandidate = target.classList.contains(SuggestionCandidateClass);

          if (!isCandidate) {
            return;
          }

          // Positions of suggested word
          const { positionStart, positionEnd } = target.dataset;

          // Replace suggested word with a tag
          const word = view.state.doc.sliceString(+positionStart, +positionEnd);

          const button = document.createElement('button');
          button.innerText = `#${word}`;
          button.title = 'Suggestion';
          button.onclick = () => {
            view.dispatch({
              changes: {
                from: +positionStart,
                to: +positionEnd,
                insert: `#${word}`,
              },
            });

            tippyInstance.hide();
          };

          tippyInstance = tippy(target, {
            content: button,
            trigger: 'click',
            theme: 'obsidian',
            interactive: true,
            appendTo: document.body,
            allowHTML: true,
            onHidden: () => {
              tippyInstance.destroy();
              console.log('instance destroyed');
            },
          });
        },
      },
    }
  );
};
