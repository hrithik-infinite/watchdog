# WatchDog Test Site

This test site contains intentional issues for testing the WatchDog accessibility and best practices scanner.

## How to Use

1. Open the site in a browser:
   ```bash
   # Using Python
   cd test-site
   python -m http.server 8080

   # Or using Node.js
   npx serve .
   ```

2. Navigate to `http://localhost:8080`

3. Open WatchDog extension and run a scan

## Issues Included

### Accessibility Issues (35 rules tested)

| Rule | Issue |
|------|-------|
| `image-alt` | Images without alt text |
| `button-name` | Empty buttons |
| `link-name` | Empty links |
| `color-contrast` | Light gray text on white background |
| `label` | Inputs without labels |
| `html-has-lang` | Missing lang attribute on html |
| `document-title` | Missing page title |
| `heading-order` | Skipped heading levels (h1 to h3) |
| `region` | Content not in landmark regions |
| `aria-valid-attr` | Invalid ARIA attributes |
| `aria-required-attr` | Roles without required attributes |
| `aria-roles` | Invalid ARIA roles |
| `meta-viewport` | user-scalable=no |
| `tabindex` | Positive tabindex values |
| `duplicate-id` | Duplicate element IDs |
| `bypass` | No skip navigation link |
| `scrollable-region-focusable` | Scrollable region without tabindex |
| `frame-title` | iframe without title |
| `valid-lang` | Invalid language code |
| `svg-img-alt` | SVG without accessible name |
| `object-alt` | Object without alt |
| `video-caption` | Video without captions |
| `audio-caption` | Audio without transcript |
| `no-autoplay-audio` | Autoplay audio |
| `td-headers-attr` | Table data cells without headers |
| `th-has-data-cells` | Table headers issues |
| `scope-attr-valid` | Invalid scope attribute |
| `table-fake-caption` | Fake table caption |
| `definition-list` | Invalid dl structure |
| `list` | Invalid list structure |
| `listitem` | li outside list |
| `nested-interactive` | Nested interactive elements |
| `input-image-alt` | Image input without alt |
| `select-name` | Select without label |
| `autocomplete-valid` | Invalid autocomplete value |
| `marquee` | Deprecated marquee element |
| `blink` | Deprecated blink element |

### Best Practices Issues

| Issue | Description |
|-------|-------------|
| Missing DOCTYPE | No DOCTYPE declaration |
| Missing charset | No charset meta tag |
| Deprecated elements | `<center>`, `<font>`, `<strike>` |
| Broken images | Images with invalid src |
| Duplicate IDs | Multiple elements with same ID |
| Empty links | Links with href="#" or empty |
| JavaScript links | Links with javascript: protocol |
| Meta refresh | Auto-refresh meta tag |
| Excessive error handlers | Multiple onerror attributes |
| Console errors | JavaScript runtime errors |
| Console warnings | Multiple console warnings |
| Vulnerable jQuery | jQuery 3.4.1 (has CVEs) |
| Password paste prevention | onpaste="return false" |
| Unsized images | Images without width/height |
| Wrong aspect ratio | Declared dimensions don't match actual |

### Performance Issues

| Issue | Description |
|-------|-------------|
| Render-blocking script | Script in head without async/defer |
| Unsized images | Cause layout shifts (CLS) |

### SEO Issues

| Issue | Description |
|-------|-------------|
| Missing title | No document title |
| Missing meta description | No meta description tag |
| Missing Open Graph | No OG tags |
| Missing canonical | No canonical URL |

## Expected Scan Results

When scanning this page with WatchDog, you should see:
- **Critical**: Several accessibility violations
- **Serious**: Multiple ARIA and form issues
- **Moderate**: Best practices violations
- **Minor**: Various warnings

## Notes

- Some issues (like autoplay audio) may not trigger if the browser blocks them
- Console errors are generated via setTimeout to ensure capture
- The vulnerable jQuery version will trigger CVE warnings
