# White-Label Portal Setup Guide

## Overview

The white-label portal allows Enterprise tier agencies to create a branded landing page for their clients at `{subdomain}.policypulse.app`.

## Prerequisites

- Enterprise subscription tier ($499/month)
- Agency subdomain configured during onboarding
- Logo file (PNG, JPG, or SVG, max 2MB)

## Setup Steps

### 1. Access Branding Settings

Navigate to **Dashboard → Settings → White-Label Portal**

### 2. Enable Portal

Toggle the "Portal Status" switch to enable your white-label portal.

### 3. Upload Logo

- Click "Upload Logo"
- Select a PNG, JPG, or SVG file (max 2MB)
- Recommended size: 200x200px
- Logo will be displayed in the header and footer

### 4. Customize Colors

- **Primary Color**: Used for buttons, links, and primary actions
- **Secondary Color**: Used for accents and highlights
- Use the color picker or enter hex codes directly
- Preview changes in real-time

### 5. Add Agency Information

Fill in:
- **Description**: Brief overview of your agency
- **Phone**: Contact phone number
- **Email**: Contact email address
- **Address**: Physical office location
- **Business Hours**: Operating hours

### 6. Save Changes

Click "Save Changes" to apply your branding configuration.

### 7. View Portal

Click the portal URL to view your branded landing page:
`https://{subdomain}.policypulse.app`

## Portal Features

The white-label portal includes:

- **Hero Section**: Agency name, logo, and tagline
- **About Section**: Agency description and contact info
- **Services Section**: List of insurance services offered
- **Contact Form**: Simple contact form for inquiries
- **Footer**: Agency info and "Powered by PolicyPulse" attribution

## DNS Configuration (Production)

For production deployment:

1. Add wildcard DNS record: `*.policypulse.app` → Vercel
2. Or add individual subdomains as agencies are created
3. Update `NEXT_PUBLIC_APP_URL` environment variable

## Local Development

To test subdomains locally:

### Option 1: Modify hosts file
```
127.0.0.1 smith-agency.localhost
127.0.0.1 john-insurance.localhost
```

### Option 2: Use query parameter
```
http://localhost:3000?subdomain=smith-agency
```

## API Endpoints

- `POST /api/upload/logo` - Upload logo to Vercel Blob
- `POST /api/branding` - Update branding configuration

## Database Schema

Branding is stored in the `agencies` table:

```typescript
branding: {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  faviconUrl?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  businessHours?: string;
}
whiteLabelEnabled: boolean;
```

## Troubleshooting

### Portal shows 404
- Ensure portal is enabled in settings
- Verify subscription is Enterprise tier
- Check subdomain is correctly configured

### Logo not uploading
- Check file size (max 2MB)
- Verify file type (PNG, JPG, SVG only)
- Ensure Backblaze B2 credentials are configured:
  - `B2_ACCESS_KEY_ID`
  - `B2_SECRET_ACCESS_KEY`
  - `B2_BUCKET_NAME`
  - `B2_PUBLIC_URL`

### Colors not applying
- Use valid hex format: `#1e40af`
- Clear browser cache
- Check for CSS conflicts

## Support

For technical support, contact:
- Email: support@policypulse.app
- Documentation: https://docs.policypulse.app
