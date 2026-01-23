# Issue Reporting Feature

## Overview

The application includes a built-in issue reporting feature that allows users to report calculation problems directly from the calculator interface. Users can either submit reports through the backend (which creates GitHub issues automatically) or open a pre-filled GitHub issue directly.

## User Experience

### Accessing the Feature

A "Report Calculation Issue" button appears below the calculation results in each country column when a calculation is available.

### Workflow

1. **Click "Report Calculation Issue"** - Opens a dialog with:
   - Privacy warning (calculation data will be public, email won't be)
   - Description field (required)
   - Optional email field for internal follow-up
   - Calculation summary preview

2. **Two submission options**:
   - **"Submit Report"** - Sends issue through backend API
     - Creates GitHub issue automatically
     - Includes full calculation context
     - Stores email separately (not publicly visible)
     - Shows success notification with link to created issue
   - **"Open in GitHub"** - Opens pre-filled GitHub issue form
     - User can edit before submitting
     - Direct engagement with maintainers
     - Requires GitHub account

## Technical Implementation

### Components

**`src/components/calculator/report-issue-dialog.tsx`**
- Dialog component handling user input
- Two submission flows (backend vs direct GitHub)
- Privacy warnings and validation

**`src/components/calculator/result-breakdown.tsx`**
- Displays "Report Issue" button when calculation is available
- Passes calculation context to dialog

**`src/components/calculator/country-column.tsx`**
- Constructs `calculationRequest` object from form state
- Passes to ResultBreakdown for issue reporting

### Backend API

**`src/app/api/issues/route.ts`**

POST endpoint that:
1. Validates description and calculation data
2. Creates GitHub issue using GitHub REST API
3. Includes all calculation context in issue body
4. Stores email separately (logged server-side, not in GitHub)
5. Returns issue URL and number

#### Request Format

```json
{
  "description": "User's issue description",
  "email": "optional@email.com",
  "calculationData": {
    "request": {
      "country": "nl",
      "year": "2025",
      "gross_annual": 60000,
      "variant": "30-ruling"
    },
    "result": {
      "gross": 60000,
      "net": 48532,
      "effective_rate": 0.191,
      "breakdown": [...],
      "currency": "EUR"
    }
  }
}
```

#### Response Format

```json
{
  "success": true,
  "issueUrl": "https://github.com/owner/repo/issues/123",
  "issueNumber": 123
}
```

### GitHub Issue Format

Issues are created with:
- **Title**: `Calculation Issue: [COUNTRY] [YEAR]`
- **Labels**: `calculation-issue`, `user-reported`
- **Body**: Markdown with:
  - User description
  - Contact email (if provided)
  - Calculation summary
  - Additional inputs (JSON)
  - Full breakdown (collapsible details)
  - Config version info

### Configuration

#### Environment Variables

Add to `.env`:

```env
# GitHub Personal Access Token for issue reporting
# Create at: https://github.com/settings/tokens
# Required scopes: repo (private) or public_repo (public)
GITHUB_TOKEN=ghp_xxxxxxxxxxxx

# GitHub repository for issues (optional, defaults to pascalwhoop/universalNetCalc)
GITHUB_REPO=owner/repository
```

#### Creating GitHub Token

1. Go to https://github.com/settings/tokens
2. Generate new token (classic)
3. Select scopes:
   - `public_repo` - For public repositories
   - `repo` - For private repositories
4. Copy token and add to `.env`

#### Fallback Behavior

If `GITHUB_TOKEN` is not configured:
- Backend logs issue to console
- Returns success but no GitHub integration
- Users can still use "Open in GitHub" option

## Security Considerations

### Privacy

- Calculation data is posted **publicly** on GitHub
- Email addresses are **NOT** posted publicly
- Users are warned before submission
- Sensitive data should not be in calculations

### Rate Limiting

- GitHub API has rate limits (5000/hour for authenticated requests)
- Consider adding application-level rate limiting for high-traffic scenarios

### Validation

- Backend validates all required fields
- Description must not be empty
- Calculation context must be complete

## Future Enhancements

Possible improvements:

1. **Duplicate Detection** - Check for similar existing issues before creating
2. **Client-side Rate Limiting** - Prevent spam from single users
3. **Issue Templates** - Different templates for different issue types
4. **Email Notifications** - Optional webhooks when issue is closed/answered
5. **Analytics** - Track common calculation issues for config improvements

## Troubleshooting

### Issues Not Being Created

1. Check `GITHUB_TOKEN` is set in environment
2. Verify token has correct permissions
3. Check `GITHUB_REPO` format is `owner/repository`
4. Review server logs for GitHub API errors

### Email Privacy

- Emails are only logged server-side or in GitHub issue comments (if manually added by maintainers)
- Never included in public issue body
- Consider GDPR compliance if storing emails persistently

### Testing

Test with:

```bash
# Run dev server
npm run dev

# Make a calculation
# Click "Report Calculation Issue"
# Fill form and submit

# Check GitHub repository for created issue
```

## Related Files

- `/src/components/calculator/report-issue-dialog.tsx` - Dialog component
- `/src/components/calculator/result-breakdown.tsx` - Button placement
- `/src/components/calculator/country-column.tsx` - Context construction
- `/src/app/api/issues/route.ts` - Backend API
- `/.env.example` - Environment variable examples
