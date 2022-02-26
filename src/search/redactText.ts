export const redactText = (text: string): string => {
  return text
    .replace(/```[\s\S]+?```/g, (m) => ' '.repeat(m.length)) // remove code blocks
    .replace(/^\n*?---[\s\S]+?---/g, (m) => ' '.repeat(m.length)) // remove yaml front matter
    .replace(/#+([a-zA-Z0-9_/]+)/g, (m) => ' '.repeat(m.length)) // remove hashtags
    .replace(/\[(.*?)\]+/g, (m) => ' '.repeat(m.length)); // remove links
};
