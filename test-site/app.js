/**
 * Test Site JavaScript
 * Contains intentional errors and bad practices for testing WatchDog
 */

// ==========================================
// CONSOLE ERRORS - Will be captured by WatchDog
// ==========================================

// Intentional reference error
try {
  console.log(undefinedVariable);
} catch (e) {
  // Rethrow to trigger error capture
  setTimeout(() => {
    console.error('ReferenceError: undefinedVariable is not defined');
  }, 100);
}

// Intentional type error
setTimeout(() => {
  console.error('TypeError: Cannot read property "foo" of undefined');
}, 200);

// Intentional syntax error message
setTimeout(() => {
  console.error('SyntaxError: Unexpected token in JSON');
}, 300);

// Network error simulation
setTimeout(() => {
  console.error('Failed to fetch: NetworkError when attempting to fetch resource');
}, 400);

// Deprecation warning
setTimeout(() => {
  console.warn('Deprecation Warning: This API will be removed in future versions');
}, 500);

// Multiple warnings
setTimeout(() => {
  console.warn('Warning 1: Something might be wrong');
  console.warn('Warning 2: Another potential issue');
  console.warn('Warning 3: Please review this code');
  console.warn('Warning 4: Performance could be improved');
  console.warn('Warning 5: Consider using a newer API');
  console.warn('Warning 6: This feature is experimental');
}, 600);

// Unhandled promise rejection
setTimeout(() => {
  Promise.reject(new Error('Unhandled Promise Rejection: API call failed'));
}, 700);

// ==========================================
// NOTIFICATION ON LOAD - Bad Practice
// ==========================================

// This requests notification permission immediately on load
// WatchDog should flag this as intrusive
if ('Notification' in window) {
  // Uncomment to actually trigger (commented to avoid browser prompts during testing)
  // Notification.requestPermission();
}

// The mere presence of this pattern in script should be detected
const notificationCode = `
  Notification.requestPermission().then(function(permission) {
    if (permission === 'granted') {
      new Notification('Hello!');
    }
  });
`;

// ==========================================
// GEOLOCATION ON LOAD - Bad Practice
// ==========================================

// This requests geolocation immediately on load
// WatchDog should flag this as intrusive
if ('geolocation' in navigator) {
  // Uncomment to actually trigger (commented to avoid browser prompts during testing)
  // navigator.geolocation.getCurrentPosition(
  //   (position) => console.log(position),
  //   (error) => console.error(error)
  // );
}

// The pattern detection should catch this
const geoCode = `
  navigator.geolocation.getCurrentPosition(success, error);
`;

// ==========================================
// EVENT HANDLERS
// ==========================================

function handleScroll() {
  // Scroll handler without passive option
  console.log('Scrolling...');
}

function handleWheel() {
  // Wheel handler without passive option
  console.log('Wheel event...');
}

function handleTouch() {
  // Touch handler without passive option
  console.log('Touch move...');
}

function handleError() {
  console.log('Image failed to load');
}

// ==========================================
// MORE ERRORS FOR TESTING
// ==========================================

// Simulate an async error
setTimeout(() => {
  try {
    JSON.parse('invalid json {');
  } catch (e) {
    console.error('JSON Parse Error:', e.message);
  }
}, 800);

// Simulate API error
setTimeout(() => {
  console.error('API Error: 500 Internal Server Error - /api/users');
}, 900);

// Security warning
setTimeout(() => {
  console.warn('Security Warning: Mixed content detected');
}, 1000);

// ==========================================
// VULNERABLE CODE PATTERNS
// ==========================================

// Using eval (security risk)
// eval('console.log("eval is dangerous")');

// innerHTML with user input (XSS risk)
// document.getElementById('output').innerHTML = userInput;

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('Test page loaded with intentional issues for WatchDog testing');

  // Add some dynamic content that might have issues
  const div = document.createElement('div');
  div.innerHTML = '<button></button>'; // Empty button
  document.body.appendChild(div);
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleScroll,
    handleWheel,
    handleTouch,
    handleError
  };
}
