import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/rangeset';
import { debounce, Debouncer, App } from 'obsidian';

import Search from './search';
import { SuggestionsPopup } from './suggestionsPopup';

const SuggestionCandidateClass = 'cm-suggestion-candidate';

const squigglyUnderline = ({ start, end }: { start: number; end: number }) =>
  Decoration.mark({
    class: SuggestionCandidateClass,
    attributes: {
      'data-position-start': `${start}`,
      'data-position-end': `${end}`,
    },
  });

export const suggestionsExtension = (search: Search) => {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      delayedDecorateView: Debouncer<[view: EditorView]>;

      constructor(view: EditorView) {
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

      private decorateView(view: EditorView): DecorationSet {
        const builder = new RangeSetBuilder<Decoration>();

        const textToHighlight = view.state.doc.slice(0).toJSON().join('\n');
        const results = textToHighlight ? search.find(textToHighlight) : [];

        for (const result of results) {
          builder.add(result.start, result.end, squigglyUnderline(result));
        }

        return builder.finish();
      }
    },
    {
      decorations: (view) => view.decorations,

      eventHandlers: {
        mousedown: (e: MouseEvent, view: EditorView) => {
          const target = e.target as HTMLElement;
          const isCandidate = target.classList.contains(SuggestionCandidateClass);

          if (!isCandidate) {
            return;
          }

          // Positions of suggested word
          const { positionStart, positionEnd } = target.dataset;

          // Replace suggested word with a tag
          const word = view.state.doc.sliceString(+positionStart, +positionEnd);
          const replaceText = search.getSuggestionReplacement(word);

          const popup = new SuggestionsPopup();
          popup.show({
            target,
            text: replaceText,
            onClick: () => {
              view.dispatch({
                changes: {
                  from: +positionStart,
                  to: +positionEnd,
                  insert: replaceText,
                },
              });
            },
          });
        },
      },
    }
  );
};
