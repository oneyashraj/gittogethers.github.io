# GitTogethers Registration Form

A modern, responsive web application for handling GitTogethers event registrations.

## Features

- GitHub username validation with profile integration
  - Auto-fills email and company name from GitHub profile
  - Displays user's avatar and customizable name (editable in Section 1)
  - Includes GitHub stats in form submission
- Dynamic form with three sections based on user role
  - Auto-fills professional details for students
  - Smart validation with inline error messages
  - Optional LinkedIn profile with URL validation
- Modern UI/UX
  - Responsive design with mobile support
  - Background mosaic using community images
  - Smooth animations and transitions
  - Consistent button heights and styling
- Configuration through config.yml
  - Time-based event visibility with end dates
  - Customizable messages with HTML support
  - Dynamic form options and help text
  - Confirmation date display for each event

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

Events are automatically hidden after their end_time has passed. If no active events exist, the no_events_message is displayed.

### Thank You Message
```yaml
thank_you_message: |
  Hi {name}! Thank you for registering for GitTogether!
  
  If you're selected, we'll send you a confirmation email for this meetup by {confirmation_date}.
  
  Supports <a href="mailto:example@example.com">HTML links</a>
```

The message supports placeholders for user's name and confirmation date.

## Local Development

1. Clone the repository
2. Open index.html in a web browser
3. For testing without config.yml:
   - A "Test Event" option will be displayed
   - Default thank you message will be shown
   - Background will use placeholder images

## Form Sections

1. **Section 1**: Basic Information
   - GitTogether event selection (time-based visibility)
   - Email address (auto-filled from GitHub)
   - City and Country
   - Current Role
   - Company/Organization Name (auto-filled from GitHub, @ prefix removed)
   - Name editing options ("Not you?" and "Edit Name")

2. **Section 2**: Professional Details
   - Role/Designation (includes company name)
   - Years of experience
   - LinkedIn profile (Optional)

3. **Section 3**: Additional Information
   - Motivation for attending
   - Underrepresented group identification (Optional)

## Notes

- For students (University/High School):
  - Section 2 is auto-filled with default values
  - Role/Designation set to "N/A"
  - Years of experience set to "0 to 2 years"
- Form validation:
  - Required fields show inline error messages
  - Radio button groups show errors below the question
  - Other options validate input text
  - LinkedIn URL must be a valid LinkedIn URL
- GitHub integration:
  - Profile picture and name shown after validation
  - Name can be edited in Section 1 only
  - Company names are cleaned (@ prefix removed)
  - GitHub stats included in form submission
- Event handling:
  - Events are shown until their end_time
  - No events message shown when all events have ended
  - Confirmation dates shown in thank you message
