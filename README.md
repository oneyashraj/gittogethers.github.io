# GitTogethers Registration Form

A modern, responsive web application for handling GitTogethers event registrations.

## Features

### User Interface
- Modern, responsive design optimized for both desktop and mobile
- Vertically centered homepage elements
- Smooth transitions between sections
- Consistent button heights and styling
- Background mosaic using community images
- Accessible form elements with ARIA labels

### GitHub Integration
- Real-time GitHub username validation
- Profile picture display on initial form
- Editable display name with "Not you?" option
- Invisible GitHub stats (public repos and followers) appended to motivation response
- Rate-limited API calls to prevent throttling

### Multi-step Form
1. **Initial GitHub Verification**
   - Username validation
   - Profile picture and name display
   - Name editing capabilities

2. **Section 1: Basic Information**
   - GitTogether event selection (time-based visibility)
   - Email address
   - City (with "Other" option)
   - Country (with "Other" option)
   - Current Role
   - Company/Organization Name

3. **Section 2: Professional Details** (Skipped for students)
   - Role/Designation
   - Years of experience
   - Optional LinkedIn profile URL

4. **Section 3: Additional Information**
   - Motivation for attending
   - Optional underrepresented group identification

### Form Validation
- Required field validation with error messages
- Mobile-optimized error display with auto-scroll
- Email format validation
- LinkedIn URL format validation
- Radio button group validation
- "Other" option input validation
- Validation before section transitions

### Dynamic Content
- Time-based event visibility
- Automatic event hiding after end time
- Configurable confirmation dates
- Role-based form field adaptation
  - Students skip Section 2
  - Company field changes to School/College based on role

### Thank You Screen
- Personalized message with first name
- Event-specific confirmation date
- Configurable message with HTML support
- Responsive button layout (side-by-side on desktop, stacked on mobile)

## Configuration

The application uses `config.yml` for configuration:

### Background Images
```yaml
background_images:
  - https://example.com/image1.webp
  - https://example.com/image2.webp
  # Add more image URLs as needed
```

### GitTogether Events
```yaml
gittogethers:
  description: "Description for closed registrations"
  no_events_message: "Message to show when no events are active"
  upcoming:
    - name: "City Name (Date)"  # Used as both display name and form value
      end_time: "2025-03-08T17:00:00+05:30"  # Indian Standard Time
      confirmation_date: "2025-03-06T23:59:00+05:30"  # When results will be announced
```

### Thank You Message and Buttons
```yaml
thank_you_message: |
  Your message with <a href="mailto:example@example.com">HTML links</a>

thank_you_buttons:
  - text: "Button Text 📢"
    url: "https://example.com"
```

## Local Development

1. Clone the repository
2. Open index.html in a web browser
3. For testing without config.yml:
   - A "Test Event" option will be displayed
   - Default thank you message will be shown
   - Background will use placeholder images

## Dependencies
- jQuery 3.2.1
- jQuery Form Plugin 4.2.2
- js-yaml 4.1.0
- Google Fonts (Roboto)

## Browser Support
- Modern browsers with CSS Grid support
- Flexbox for layouts
- CSS custom properties (variables)
- Intersection Observer API for animations
