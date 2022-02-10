import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

type SuggestionsPopupProps = {
  target: HTMLElement;
  text: string;
  onClick: () => void;
};

export class SuggestionsPopup {
  public show(props: SuggestionsPopupProps): void {
    const { text, onClick, target } = props;

    const button = document.createElement('button');
    button.innerText = text;
    button.title = 'Suggestion';
    button.onclick = () => {
      onClick();
      tippyInstance.hide();
    };

    const tippyInstance = tippy(target, {
      content: button,
      trigger: 'click',
      theme: 'obsidian',
      interactive: true,
      appendTo: document.body,
      allowHTML: true,
      onHidden: () => {
        tippyInstance.destroy();
      },
    });
  }
}
