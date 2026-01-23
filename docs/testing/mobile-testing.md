# Mobile Responsive Design - Testing Guide

## Quick Start

```bash
# Start the development server
npm run dev

# Open in browser
open http://localhost:3000
```

## Chrome DevTools Mobile Testing

### 1. Open DevTools
- **Windows/Linux**: Press `F12` or `Ctrl+Shift+I`
- **Mac**: Press `Cmd+Option+I`

### 2. Enable Device Toolbar
- **Windows/Linux**: Press `Ctrl+Shift+M`
- **Mac**: Press `Cmd+Shift+M`
- Or click the device icon in DevTools toolbar

### 3. Select Device
Choose from presets or use "Responsive":
- **iPhone 12 Pro** (390 × 844) - Most common mobile
- **iPhone SE** (375 × 667) - Small screen
- **Pixel 5** (393 × 851) - Android
- **iPad** (768 × 1024) - Tablet breakpoint
- **Responsive** - Custom sizing

---

## Testing Checklist

### Main Calculator Page

#### Mobile View (< 768px)

**Header & Navigation**
- [ ] Header shows "Compare Countries" with compact text
- [ ] Save button shows icon only (no text)
- [ ] Share button shows icon only (no text)
- [ ] Buttons are easily tappable (not too small)

**Country Tabs**
- [ ] Tabs appear when you have 1+ countries
- [ ] Each tab shows country flag and code (e.g., "🇳🇱 NL")
- [ ] Active tab is highlighted
- [ ] "+" button appears on the right
- [ ] Tabs scroll horizontally if many countries
- [ ] Tapping a tab switches the visible country

**Country Form**
- [ ] Only one country visible at a time
- [ ] Form inputs are full width
- [ ] Input fields are easy to tap (larger height)
- [ ] Select dropdowns are easy to use
- [ ] "Copy all" button shows "Copy" (short text)
- [ ] Remove button (X) is visible and tappable

**Comparison Summary** (when 2+ countries)
- [ ] Summary card appears above country form
- [ ] Table scrolls horizontally if needed
- [ ] Text is readable (not too small)
- [ ] Values don't wrap awkwardly

**Results & Charts**
- [ ] Results display below form
- [ ] Breakdown accordion works smoothly
- [ ] Charts adapt to mobile width
- [ ] No horizontal overflow

#### Desktop View (≥ 768px)

**Header**
- [ ] Full header with "Add up to 4 countries..." text
- [ ] "Save" button shows text
- [ ] "Share" button shows text
- [ ] "Add Country" button shows full text

**Country Layout**
- [ ] All countries side by side in grid
- [ ] Horizontal scroll works smoothly
- [ ] Each country column has consistent width

**Comparison Summary**
- [ ] Summary sticks to top when scrolling (sticky)
- [ ] Table has comfortable spacing
- [ ] All columns visible without scroll

### History Page

#### Mobile View (< 768px)
- [ ] Header "Calculation History" is readable size
- [ ] Search bar is full width
- [ ] "Clear All" button is full width below search
- [ ] History items are single column (stacked)
- [ ] Each card is easy to tap

#### Desktop View (≥ 768px)
- [ ] Search and "Clear All" button side by side
- [ ] History items in 2-column grid
- [ ] Cards have comfortable spacing

---

## Specific Interactions to Test

### Adding a Country (Mobile)
1. Tap the "+" button in the tabs
2. **Expected**: New tab appears and becomes active
3. **Expected**: New country form is shown
4. **Expected**: Can add up to 4 countries

### Switching Between Countries (Mobile)
1. Add 2+ countries with different data
2. Tap on different country tabs
3. **Expected**: Form and results switch instantly
4. **Expected**: No layout shift or flicker
5. **Expected**: Data persists when switching back

### Removing a Country (Mobile)
1. Add 2+ countries
2. Switch to second country tab
3. Tap the X button to remove
4. **Expected**: Tab disappears
5. **Expected**: Active tab adjusts to show remaining country

### Copy Salary to All (Mobile)
1. Add 2+ countries
2. Enter salary in first country
3. Tap "Copy" button
4. Switch to other country tabs
5. **Expected**: Salary is copied with currency conversion

### Comparison Summary Scroll (Mobile)
1. Add 3+ countries
2. Scroll down to see comparison summary
3. **Expected**: Table scrolls horizontally
4. **Expected**: Can see all country data by scrolling
5. **Expected**: No vertical scroll within table

---

## Responsive Breakpoint Testing

Test these specific viewport widths:

### Critical Breakpoints
- **375px**: iPhone SE (smallest modern phone)
- **390px**: iPhone 12/13/14 Pro (most common)
- **414px**: iPhone Plus models
- **768px**: Tablet / Desktop breakpoint (md:)
- **1024px**: Desktop (lg:)

### Test Procedure
1. Start at mobile width (375px)
2. Gradually increase width
3. Watch for layout changes at 768px
4. Verify no broken layouts in between

---

## Touch Target Verification

### Minimum Size Requirement: 44px × 44px

**Test Method**:
1. Open Chrome DevTools
2. Go to "Rendering" tab (3-dot menu → More tools → Rendering)
3. Enable "Hit test borders"
4. Verify all interactive elements meet minimum size

**Elements to Check**:
- [ ] All buttons
- [ ] Select dropdowns
- [ ] Input fields
- [ ] Tab triggers
- [ ] Accordion triggers
- [ ] Remove (X) buttons

---

## Common Issues to Look For

### Layout Issues
- ❌ Horizontal scroll on mobile (except comparison table)
- ❌ Text too small to read
- ❌ Buttons too small to tap
- ❌ Elements overlapping
- ❌ Form inputs cut off
- ❌ Layout shift when switching countries

### Interaction Issues
- ❌ Tabs not responding to taps
- ❌ Buttons not responding
- ❌ Select dropdowns hard to use
- ❌ Accidental taps on nearby elements
- ❌ Scroll not working smoothly

### Visual Issues
- ❌ Text wrapping awkwardly
- ❌ Icons too large or too small
- ❌ Inconsistent spacing
- ❌ Colors hard to read
- ❌ Badges or labels cut off

---

## Performance Testing

### Metrics to Check
1. **Tab switching**: Should be instant (< 100ms)
2. **Page load**: Should be fast on 3G simulation
3. **Scroll performance**: Should be 60fps
4. **Input lag**: Should feel responsive

### How to Test
1. Open Chrome DevTools
2. Go to Performance tab
3. Enable CPU throttling (4x slowdown)
4. Test interactions and record
5. Check for dropped frames or janky scroll

---

## Accessibility Testing

### Keyboard Navigation (Mobile Focus)
1. Use tab key to navigate
2. **Expected**: Logical tab order
3. **Expected**: Visible focus indicators
4. **Expected**: Can reach all interactive elements

### Screen Reader Testing
1. Enable VoiceOver (iOS) or TalkBack (Android)
2. Navigate through the app
3. **Expected**: All buttons announced correctly
4. **Expected**: Form labels read properly
5. **Expected**: Status updates announced

---

## Cross-Browser Testing

### iOS Safari
- [ ] Test on real iPhone (best) or simulator
- [ ] Check tap targets work correctly
- [ ] Verify scroll behavior is smooth
- [ ] Test form inputs (keyboard behavior)

### Android Chrome
- [ ] Test on real Android device or emulator
- [ ] Check button sizes
- [ ] Verify select dropdowns work
- [ ] Test back button behavior

### Firefox Mobile
- [ ] Basic functionality check
- [ ] Layout looks correct
- [ ] No console errors

---

## Edge Cases to Test

### Single Country
- [ ] Works on mobile without tabs
- [ ] Can still add countries
- [ ] Layout looks good

### Maximum Countries (4)
- [ ] "+" button disappears
- [ ] All tabs visible (scroll if needed)
- [ ] Can switch between all tabs
- [ ] Performance is still good

### Long Country Names
- [ ] Tabs don't break layout
- [ ] Text truncates gracefully
- [ ] Still readable and accessible

### Empty State
- [ ] Mobile shows helpful message
- [ ] "Add Country" guidance clear
- [ ] Layout doesn't break

### Network Offline
- [ ] App doesn't crash
- [ ] Graceful error messages
- [ ] Can still navigate

---

## Regression Testing

After any future changes, verify:

### Critical Paths
1. [ ] Can add country on mobile
2. [ ] Can switch between countries
3. [ ] Can enter salary and see results
4. [ ] Can save and share calculations
5. [ ] Can remove countries
6. [ ] History page works

### Visual Consistency
1. [ ] Mobile layout matches design
2. [ ] Desktop layout unchanged
3. [ ] Spacing consistent throughout
4. [ ] Colors and fonts correct

---

## Reporting Issues

When you find a bug, include:

1. **Device/Browser**: e.g., "iPhone 12 Pro, Safari 16"
2. **Viewport Size**: e.g., "390px × 844px"
3. **Steps to Reproduce**: Numbered list
4. **Expected Behavior**: What should happen
5. **Actual Behavior**: What actually happens
6. **Screenshot**: If applicable
7. **Console Errors**: If any

---

## Success Criteria

✅ **Mobile implementation is successful if**:
1. All interactions work on mobile (< 768px)
2. No horizontal scroll (except intended areas)
3. All tap targets are ≥ 44px
4. Text is readable without zooming
5. Forms are easy to use
6. Performance is smooth
7. Desktop experience unchanged
8. No TypeScript or build errors

---

## Quick Visual Test

**30-Second Mobile Check**:
1. Resize browser to 375px width
2. Add a country
3. Enter a salary
4. Add another country
5. Switch tabs
6. Check results

If all of the above works smoothly, mobile implementation is working! ✅

---

**Happy Testing!** 📱
