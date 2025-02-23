# GitTogethers Registration Form

A modern, responsive web application for handling GitTogethers event registrations.

![image](https://github.com/user-attachments/assets/ff3905e1-f48e-4652-beb3-b77cae57612e)

## Key Features
- Modern, responsive design optimized for both desktop and mobile
- Real-time GitHub username validation
- GitHub stats (public repos and followers) appended to response
- Rate-limited API calls to prevent throttling
- Mobile-optimized error display with auto-scroll

## User Interface
1. **Homepage**
   - GitHub username validation from API

2. **Section 1: Basic Information**
   - Profile picture and name display from GitHub API
   - Name editing feature
   - GitTogether event selection (time-based visibility)
   - Email address
   - City (with "Other" option)
   - Country (with "Other" option)
   - Current Role
   - Company/Organization Name

3. **Section 2: Professional Details** (Skipped for students)
   - Role/Designation
   - Years of experience
   - LinkedIn profile URL (Optional)

4. **Section 3: Additional Information**
   - Motivation for attending
   - Underrepresented group identification (Optional)

5. **Thank You Screen**
   - Personalized message with first name
   - Event-specific confirmation date
   - Configurable thank you message with HTML support
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
  description: "Text to display below GitTogether event selection question"
  no_events_message: "Message to show when no events are active"
  upcoming:
    - name: "City Name (Date)"
      end_time: "2025-03-08T17:00:00+05:30"  # Indian Standard Time
      confirmation_date: "2025-03-06T23:59:00+05:30"  # When confirmation emails will be sent to shortlisted participants.
```

### Thank You Message and Buttons
```yaml
thank_you_message: |
  Your message with <a href="mailto:example@example.com">HTML links</a>

thank_you_buttons:
  - text: "Button Text 📢"
    url: "https://example.com"
```

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
