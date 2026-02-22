# Tax Deduction UI Implementation Status

## Summary

A progressive disclosure UI for tax deductions has been implemented, allowing users to add, edit, and remove deductions through a modal dialog interface. The backend calculation engine fully supports deductions, but there's a state management issue preventing the deduction values from being saved correctly.

## What Works ✅

### Backend (100% Complete)
1. **Enhanced Deduction Node Type** - Supports:
   - `cap` - Maximum deduction amount
   - `threshold` - Only amounts above/below threshold
   - `rate_limit` - Max tax benefit rate (metadata)
   - `phaseout` - Income-based reduction

2. **Netherlands 2025 Configuration** - Implements 3 major deductions:
   - Mortgage Interest (with 30-year limit, 37.48% rate cap)
   - Pension Contributions (capped by jaarruimte)
   - Healthcare Costs (threshold-based)

3. **API Integration** - Correctly:
   - Accepts number inputs for deductions
   - Calculates deductions when inputs provided
   - Returns breakdown with deduction amounts

### UI Components (95% Complete)
1. **DeductionManager Component** (`src/components/calculator/deduction-manager.tsx`)
   - Progressive disclosure pattern
   - "Add Deduction" button
   - Modal dialog for selecting and configuring deductions
   - Active deductions list with edit/remove buttons
   - Handles compound deductions (multiple fields per deduction type)

2. **Compound Deduction Support**
   - Mortgage: Shows both `mortgage_interest_paid` AND `mortgage_start_year`
   - Pension: Shows both `pension_contributions` AND `jaarruimte_available`
   - Healthcare: Shows single field (threshold calculated automatically)

3. **Results Breakdown**
   - Deductions section in accordion
   - Shows €0 when no deductions
   - Shows actual amounts when deductions applied

## Current Issue ❌

### State Management Bug
**Problem**: When users fill in deduction fields in the modal and click "Add", only some fields are being saved to formValues.

**Evidence**:
```javascript
// User fills in dialog:
mortgage_interest_paid: 10000 ✓
mortgage_start_year: 2020 ✓

// API request shows:
{
  mortgage_interest_paid: 0,      // ❌ Not saved!
  mortgage_start_year: 2020,      // ✅ Saved
}
```

**Suspected Cause**:
The `editingValues` state in DeductionManager isn't being updated properly when inputs change. The `handleUpdateEditingValue` function should update state via `setEditingValues`, but React state updates might not be completing before `handleSaveDeduction` reads from `editingValues`.

**Code Path**:
1. User types in input → `onChange` fires
2. `handleUpdateEditingValue(fieldKey, value)` called
3. `setEditingValues(prev => ({ ...prev, [key]: value }))` - State update queued
4. User clicks "Add" → `handleSaveDeduction()` called
5. Reads `editingValues[field]` - May still have old value if state hasn't updated yet

## Test Coverage

### E2E Tests Created
File: `tests/e2e/deduction-workflow.spec.ts`

Six comprehensive test scenarios:
1. ✅ Add mortgage interest deduction and verify calculation updates
2. ✅ Edit an existing deduction
3. ✅ Remove a deduction
4. ✅ Add multiple deductions
5. ✅ Persist deductions in URL
6. ✅ Restore deductions from URL

**Current Status**: All tests fail due to the state management bug above.

### Test Infrastructure
- Uses Playwright with headless Chrome
- Configured for port 3003 (reuses existing dev server)
- API request/response logging for debugging
- Screenshots on failure

## Next Steps to Fix

### Option 1: Add Explicit State Flush
Add a small delay after each input change to ensure React finishes updating:

```typescript
const handleUpdateEditingValue = async (key: string, value: string) => {
  setEditingValues(prev => ({ ...prev, [key]: value }))
  await new Promise(resolve => setTimeout(resolve, 100))
}
```

### Option 2: Use Refs Instead of State
Store editing values in a ref to avoid async state updates:

```typescript
const editingValuesRef = useRef<Record<string, string>>({})

const handleUpdateEditingValue = (key: string, value: string) => {
  editingValuesRef.current[key] = value
  setEditingValues({ ...editingValuesRef.current }) // Trigger re-render
}

const handleSaveDeduction = () => {
  // Read from ref, not state
  const values = editingValuesRef.current
  // ...
}
```

### Option 3: Controlled Form with useForm
Use a form library like `react-hook-form` to manage dialog state:

```typescript
const { register, handleSubmit, reset } = useForm()

const onSubmit = (data) => {
  // data already has all field values
  relatedFields.forEach(field => {
    onUpdateFormValue(field, data[field] || "0")
  })
}
```

### Option 4: Debug Current Implementation
Add console.log statements to track state updates:

```typescript
const handleUpdateEditingValue = (key: string, value: string) => {
  console.log('Updating editing value:', key, value)
  setEditingValues(prev => {
    const next = { ...prev, [key]: value }
    console.log('New editingValues:', next)
    return next
  })
}

const handleSaveDeduction = () => {
  console.log('Saving with editingValues:', editingValues)
  // ...
}
```

## Manual Testing Steps

To manually verify the fix:
1. Navigate to http://localhost:3003/calculator
2. Select Netherlands, 2025
3. Enter gross salary: €60,000
4. Note the baseline net salary
5. Click "Add Deduction"
6. Select "Mortgage Interest Paid (Optional)"
7. Fill in:
   - Mortgage Interest Paid: 10000
   - Mortgage Start Year: 2020
8. Click "Add"
9. Verify:
   - "Active Deductions" section appears
   - Mortgage deduction shows "10,000"
   - Net salary increases (deduction reduces tax)
   - Deductions accordion shows non-zero amount

## Files Modified

1. `/src/components/calculator/deduction-manager.tsx` - NEW
2. `/src/components/calculator/country-column.tsx` - Import DeductionManager, convert number inputs
3. `/configs/nl/2025/base.yaml` - Add deduction inputs and calculations
4. `/packages/engine/src/evaluators.ts` - Enhanced deduction evaluator
5. `/packages/schema/src/config-types.ts` - Add ThresholdConfig, enhance DeductionNode
6. `/playwright.config.ts` - Support BASE_URL env var, always reuse server
7. `/tests/e2e/deduction-workflow.spec.ts` - NEW - Comprehensive E2E tests

## Architecture Decisions

### Why Progressive Disclosure?
- Cleaner UI (no clutter for users who don't have deductions)
- Better for international users (deduction types vary by country)
- Scalable (easy to add more deduction types)

### Why Compound Deductions Pattern?
- Some deductions require multiple fields (mortgage: amount + start year)
- Grouping related fields improves UX
- Backend validation (e.g., 30-year mortgage limit) needs all fields

### Why Base Config Not Variant?
- Deductions should be composable with variants (30% ruling + mortgage)
- Optional inputs (default: 0) maintain backward compatibility
- Users can selectively enable deductions

## Related Documentation

- `/docs/deduction-framework.md` - Complete framework design
- `/docs/deduction-implementation-summary.md` - Implementation details
- `/CLAUDE.md` - Project overview and development commands
