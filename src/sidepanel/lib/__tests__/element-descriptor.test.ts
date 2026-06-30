import { describe, expect, it } from 'vitest';
import { describeElement } from '../element-descriptor';

describe('describeElement — fallback for empty/invalid input', () => {
  it('returns "this element" for an empty string', () => {
    expect(describeElement('')).toBe('this element');
  });

  it('returns "this element" for whitespace-only html', () => {
    expect(describeElement('   \n\t  ')).toBe('this element');
  });

  it('returns "this element" when given a non-string value', () => {
    expect(describeElement(undefined as unknown as string)).toBe('this element');
    expect(describeElement(null as unknown as string)).toBe('this element');
    expect(describeElement(42 as unknown as string)).toBe('this element');
  });

  it('returns "this element" when there is no element child (text only)', () => {
    expect(describeElement('just some bare text')).toBe('this element');
  });
});

describe('describeElement — anchor (<a>)', () => {
  it('prefers aria-label over text and title', () => {
    expect(describeElement('<a aria-label="Go home" title="Home page">Home</a>')).toBe(
      'the "Go home" link'
    );
  });

  it('falls back to text content when no aria-label', () => {
    expect(describeElement('<a title="Home page">Click here</a>')).toBe('the "Click here" link');
  });

  it('falls back to title when no aria-label or text', () => {
    expect(describeElement('<a title="Home page" href="/x"></a>')).toBe('the "Home page" link');
  });

  it('describes a link by its href when there is no accessible name', () => {
    expect(describeElement('<a href="/pricing"></a>')).toBe('a link to /pricing');
  });

  it('returns "a link" when there is neither a name nor an href', () => {
    expect(describeElement('<a></a>')).toBe('a link');
  });

  it('clamps a very long href to 60 characters', () => {
    const href = `/path/${'x'.repeat(80)}`;
    const result = describeElement(`<a href="${href}"></a>`);
    expect(result.startsWith('a link to ')).toBe(true);
    const clamped = result.slice('a link to '.length);
    expect(clamped.length).toBe(60);
    expect(clamped.endsWith('…')).toBe(true);
  });
});

describe('describeElement — button', () => {
  it('uses aria-label first', () => {
    expect(describeElement('<button aria-label="Submit form" title="t">Go</button>')).toBe(
      'the "Submit form" button'
    );
  });

  it('uses text content when no aria-label', () => {
    expect(describeElement('<button>Buy now</button>')).toBe('the "Buy now" button');
  });

  it('uses title when no aria-label or text', () => {
    expect(describeElement('<button title="Close"></button>')).toBe('the "Close" button');
  });

  it('returns "a button" when unnamed', () => {
    expect(describeElement('<button></button>')).toBe('a button');
  });
});

describe('describeElement — image (<img>)', () => {
  it('prefers aria-label over alt and title', () => {
    expect(describeElement('<img aria-label="Logo" alt="alt text" title="t" src="x.png">')).toBe(
      'the image "Logo"'
    );
  });

  it('falls back to alt then title', () => {
    expect(describeElement('<img alt="Company logo" src="x.png">')).toBe(
      'the image "Company logo"'
    );
    expect(describeElement('<img title="Tip" src="x.png">')).toBe('the image "Tip"');
  });

  it('falls back to the file name when there is no accessible name', () => {
    expect(describeElement('<img src="/assets/logo.png?v=2">')).toBe('the image "logo.png"');
  });

  it('returns "an image" when src is a data: URI and there is no name', () => {
    expect(describeElement('<img src="data:image/png;base64,AAAA">')).toBe('an image');
  });

  it('returns "an image" when there is neither name nor src', () => {
    expect(describeElement('<img>')).toBe('an image');
  });
});

describe('describeElement — input variants', () => {
  it('treats type=submit as a named button via value', () => {
    expect(describeElement('<input type="submit" value="Send">')).toBe('the "Send" button');
  });

  it('prefers aria-label over value for submit buttons', () => {
    expect(describeElement('<input type="submit" aria-label="Submit" value="Send">')).toBe(
      'the "Submit" button'
    );
  });

  it('treats type=button and type=reset as buttons', () => {
    expect(describeElement('<input type="button" value="Click">')).toBe('the "Click" button');
    expect(describeElement('<input type="reset" title="Reset">')).toBe('the "Reset" button');
  });

  it('returns "a button" for an unnamed submit/button/reset input', () => {
    expect(describeElement('<input type="submit">')).toBe('a button');
  });

  it('describes type=image with a label', () => {
    expect(describeElement('<input type="image" alt="Search" src="s.png">')).toBe(
      'the image button "Search"'
    );
  });

  it('describes type=image by file name when no name', () => {
    expect(describeElement('<input type="image" src="/img/go.gif">')).toBe(
      'the image button "go.gif"'
    );
  });

  it('returns "an image button" for an unnamed image input with a data: src', () => {
    expect(describeElement('<input type="image" src="data:image/gif;base64,AA">')).toBe(
      'an image button'
    );
  });

  it('describes a named checkbox', () => {
    expect(describeElement('<input type="checkbox" aria-label="Agree">')).toBe(
      'the "Agree" checkbox'
    );
    expect(describeElement('<input type="checkbox" title="Opt in">')).toBe('the "Opt in" checkbox');
  });

  it('returns "a checkbox" when unnamed', () => {
    expect(describeElement('<input type="checkbox">')).toBe('a checkbox');
  });

  it('describes a named radio button', () => {
    expect(describeElement('<input type="radio" aria-label="Yes">')).toBe('the "Yes" radio button');
    expect(describeElement('<input type="radio" title="No">')).toBe('the "No" radio button');
  });

  it('returns "a radio button" when unnamed', () => {
    expect(describeElement('<input type="radio">')).toBe('a radio button');
  });

  it('describes a generic field using placeholder/title/value precedence', () => {
    expect(describeElement('<input aria-label="Email" placeholder="p">')).toBe('the "Email" field');
    expect(describeElement('<input placeholder="Your email">')).toBe('the "Your email" field');
    expect(describeElement('<input title="Phone">')).toBe('the "Phone" field');
    expect(describeElement('<input value="prefilled">')).toBe('the "prefilled" field');
  });

  it('defaults a typeless input to a text field branch', () => {
    expect(describeElement('<input>')).toBe('a form field');
  });

  it('treats an unknown type like a generic field', () => {
    expect(describeElement('<input type="email" placeholder="Email">')).toBe('the "Email" field');
  });

  it('returns "a form field" for an unnamed generic input', () => {
    expect(describeElement('<input type="text">')).toBe('a form field');
  });
});

describe('describeElement — textarea', () => {
  it('uses aria-label/placeholder/title precedence', () => {
    expect(describeElement('<textarea aria-label="Comments" placeholder="p"></textarea>')).toBe(
      'the "Comments" field'
    );
    expect(describeElement('<textarea placeholder="Notes"></textarea>')).toBe('the "Notes" field');
    expect(describeElement('<textarea title="Bio"></textarea>')).toBe('the "Bio" field');
  });

  it('returns "a text field" when unnamed', () => {
    expect(describeElement('<textarea></textarea>')).toBe('a text field');
  });
});

describe('describeElement — select', () => {
  it('uses aria-label then title', () => {
    expect(describeElement('<select aria-label="Country" title="t"></select>')).toBe(
      'the "Country" dropdown'
    );
    expect(describeElement('<select title="State"></select>')).toBe('the "State" dropdown');
  });

  it('returns "a dropdown" when unnamed', () => {
    expect(describeElement('<select></select>')).toBe('a dropdown');
  });
});

describe('describeElement — headings h1-h6', () => {
  for (const level of [1, 2, 3, 4, 5, 6] as const) {
    it(`describes an h${level} by its text`, () => {
      expect(describeElement(`<h${level}>Welcome</h${level}>`)).toBe('the "Welcome" heading');
    });
  }

  it('prefers aria-label over text', () => {
    expect(describeElement('<h2 aria-label="Section title">Visible</h2>')).toBe(
      'the "Section title" heading'
    );
  });

  it('returns "a heading" when there is no name', () => {
    expect(describeElement('<h1></h1>')).toBe('a heading');
  });
});

describe('describeElement — default branch (TAG_NOUNS + fallback)', () => {
  it('maps known tags to friendly nouns', () => {
    expect(describeElement('<nav></nav>')).toBe('a navigation');
    expect(describeElement('<ul></ul>')).toBe('a list');
    expect(describeElement('<ol></ol>')).toBe('a list');
    expect(describeElement('<li></li>')).toBe('a list item');
    expect(describeElement('<dl></dl>')).toBe('a list');
    expect(describeElement('<p></p>')).toBe('a paragraph');
    expect(describeElement('<form></form>')).toBe('a form');
    expect(describeElement('<table></table>')).toBe('a table');
    expect(describeElement('<svg></svg>')).toBe('a graphic');
    expect(describeElement('<iframe></iframe>')).toBe('a frame');
    expect(describeElement('<label></label>')).toBe('a label');
    expect(describeElement('<video></video>')).toBe('a video');
    expect(describeElement('<audio></audio>')).toBe('an audio');
    expect(describeElement('<section></section>')).toBe('a section');
    expect(describeElement('<header></header>')).toBe('a header');
    expect(describeElement('<footer></footer>')).toBe('a footer');
    expect(describeElement('<main></main>')).toBe('a main content');
    expect(describeElement('<article></article>')).toBe('an article');
    expect(describeElement('<span></span>')).toBe('an element');
    expect(describeElement('<div></div>')).toBe('an element');
  });

  it('falls back to the raw tag name when not in TAG_NOUNS', () => {
    expect(describeElement('<aside></aside>')).toBe('an aside');
    expect(describeElement('<figure></figure>')).toBe('a figure');
  });

  it('names a default-branch element by aria-label/text/title', () => {
    expect(describeElement('<nav aria-label="Main">x</nav>')).toBe('the "Main" navigation');
    expect(describeElement('<p>Hello world</p>')).toBe('the "Hello world" paragraph');
    expect(describeElement('<section title="Intro"></section>')).toBe('the "Intro" section');
  });

  it('uses indefinite "an" before vowel-led nouns and "a" otherwise', () => {
    expect(describeElement('<article></article>')).toBe('an article');
    expect(describeElement('<table></table>')).toBe('a table');
  });
});

describe('describeElement — text normalization and clamping', () => {
  it('collapses runs of whitespace in text content', () => {
    expect(describeElement('<button>  Buy   now \n  </button>')).toBe('the "Buy now" button');
  });

  it('clamps long text content to 60 characters with an ellipsis', () => {
    const long = 'A'.repeat(80);
    const result = describeElement(`<button>${long}</button>`);
    const name = result.slice('the "'.length, -'" button'.length);
    expect(name.length).toBe(60);
    expect(name.endsWith('…')).toBe(true);
    expect(name).toBe(`${'A'.repeat(59)}…`);
  });

  it('does not clamp text exactly at the 60-char limit', () => {
    const exact = 'B'.repeat(60);
    expect(describeElement(`<button>${exact}</button>`)).toBe(`the "${exact}" button`);
  });
});

describe('describeElement — fileName edge cases', () => {
  it('strips query and hash fragments from the src', () => {
    expect(describeElement('<img src="/a/b/pic.jpg?w=100#frag">')).toBe('the image "pic.jpg"');
  });

  it('uses the whole cleaned src when there is no slash', () => {
    expect(describeElement('<img src="logo.png">')).toBe('the image "logo.png"');
  });

  it('uses the cleaned src when it ends in a slash (empty basename)', () => {
    // base is '' after the trailing slash, so it falls back to the full clean url.
    expect(describeElement('<img src="https://cdn.example.com/">')).toBe(
      'the image "https://cdn.example.com/"'
    );
  });
});

describe('describeElement — uses only the first element of a snippet', () => {
  it('describes the first element child and ignores siblings', () => {
    expect(describeElement('<button>First</button><a href="/x">Second</a>')).toBe(
      'the "First" button'
    );
  });

  it('is case-insensitive on the tag name', () => {
    expect(describeElement('<BUTTON>Up</BUTTON>')).toBe('the "Up" button');
  });
});
