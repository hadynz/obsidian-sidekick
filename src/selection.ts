import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/rangeset';
import { debounce, Debouncer } from 'obsidian';
import { findAll } from 'highlight-words-core';

const SuggestionCandidateClass = 'cm-suggestion-candidate';
const SuggestionCandidateHighlightClass = `${SuggestionCandidateClass}--highlight`;

const squigglyUnderline = Decoration.mark({
  class: SuggestionCandidateClass,
});

export const matchHighlighter = (searchWords: string[]) => {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      delayedDecorateView: Debouncer<[view: EditorView]>;

      constructor(view: EditorView) {
        this.updateDebouncer(view);
        this.decorations = this.decorateView(view);
      }

      public update(update: ViewUpdate): void {
        if (update.selectionSet || update.docChanged || update.viewportChanged) {
          this.decorations = Decoration.none;
          this.delayedDecorateView(update.view);
        }
      }

      private updateDebouncer(_view: EditorView) {
        this.delayedDecorateView = debounce(
          (view: EditorView) => {
            this.decorations = this.decorateView(view);
            view.update([]); // force a view update so that the decorations we just set get applied
          },
          0,
          true
        );
      }

      decorateView(view: EditorView): DecorationSet {
        const builder = new RangeSetBuilder<Decoration>();

        for (const part of view.visibleRanges) {
          const textToHighlight = view.state.doc.slice(part.from, part.to).toJSON().join('\n');
          const chunks = findAll({ searchWords, textToHighlight });

          for (const chunk of chunks.filter((chunk) => chunk.highlight)) {
            builder.add(chunk.start, chunk.end, squigglyUnderline);
          }
        }

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

          // Highlight suggestion
          target.addClass(SuggestionCandidateHighlightClass);

          const pos = view.posAtDOM(target);
          const before = view.state.doc.sliceString(Math.max(0, pos - 5), pos);

          console.log('mousedown', target, pos, view.state.doc);
          console.log('before', before);
        },
      },
    }
  );
};
