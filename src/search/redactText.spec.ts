import { redactText } from './redactText';

describe('redactText', () => {
  it('Hashtags are redacted', () => {
    const sentence = 'I love playing #football';
    const expected = 'I love playing          ';

    const actual = redactText(sentence);

    expect(actual).toEqual(expected);
  });

  it('Hierarchial hashtags are redacted', () => {
    const sentence = 'I love playing #sport/football';
    const expected = 'I love playing                ';

    const actual = redactText(sentence);

    expect(actual).toEqual(expected);
  });

  it('Links are redacted', () => {
    const sentence = 'I love [[sleeping]] and [[https://aoe.com|gaming]]';
    const expected = 'I love              and                           ';

    const actual = redactText(sentence);

    expect(actual).toEqual(expected);
  });

  it('Code blocks are redacted', () => {
    const sentence = '```cs\
code block\
```';
    const expected = '     \
          \
   ';

    const actual = redactText(sentence);

    expect(actual).toEqual(expected);
  });

  it('Frontmatter is redacted', () => {
    const sentence = '---\
tags: [aoe, aoe2]\
---\
# Heading 1\
```';
    const expected = '   \
                 \
   \
# Heading 1\
```';

    const actual = redactText(sentence);

    expect(actual).toEqual(expected);
  });

  it('Frontmatter with preceding empty lines is redacted', () => {
    const sentence = '\
\
---\
tags: [aoe, aoe2]\
---\
# Heading 1\
```';
    const expected = '\
\
   \
                 \
   \
# Heading 1\
```';

    const actual = redactText(sentence);

    expect(actual).toEqual(expected);
  });
});
