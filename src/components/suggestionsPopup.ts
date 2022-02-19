import { App, Menu, MenuItem } from 'obsidian';

type SuggestionsModalProps = {
  app: App;
  mouseEvent: MouseEvent;
  suggestions: string[];
  onClick: (replaceText: string) => void;
};

const item = (icon, title, click) => {
  return (item: MenuItem) => item.setIcon(icon).setTitle(title).onClick(click);
};

export const showSuggestionsModal = (props: SuggestionsModalProps): void => {
  const { app, mouseEvent, suggestions, onClick } = props;

  const menu = new Menu(app);

  suggestions.forEach((replaceText) => {
    menu.addItem(
      item('pencil', `Replace with ${replaceText}`, () => {
        onClick(replaceText);
      })
    );
  });

  menu.addSeparator();
  menu.showAtMouseEvent(mouseEvent);
};
