import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  PluginValue,
} from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/rangeset';
import { debounce, Debouncer } from 'obsidian';

import Search from '../search';
import { SuggestionsPopup } from '../components/suggestionsPopup';

import './suggestionsExtension.css';

const SuggestionCandidateClass = 'cm-suggestion-candidate';

const underlineDecoration = (start: number, end: number, word: string) =>
  Decoration.mark({
    class: SuggestionCandidateClass,
    attributes: {
      'data-search-word': word,
      'data-position-start': `${start}`,
      'data-position-end': `${end}`,
    },
  });

export const suggestionsExtension = (search: Search): ViewPlugin<PluginValue> => {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      delayedDecorateView: Debouncer<[view: EditorView]>;

      constructor(view: EditorView) {
        this.updateDebouncer(view);
        this.decorations = this.decorateView(view);
      }

      public update(update: ViewUpdate): void {
        if (update.docChanged || update.viewportChanged) {
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

        // Decorate visible ranges only for performance reasons
        for (const { from, to } of view.visibleRanges) {
          const textToHighlight = view.state.sliceDoc(from, to);
          const results = textToHighlight ? search.find(textToHighlight) : [];

          for (const result of results) {
            // Offset result by the start of the visible range
            const start = from + result.start;
            const end = from + result.end;

            // Add the decoration
            builder.add(start, end, underlineDecoration(start, end, result.matchingWord));
          }
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

          // Extract position and search index word from target element data attributes state
          const { positionStart, positionEnd, searchWord } = target.dataset;

          const replaceText = search.getSuggestionReplacement(searchWord);

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
