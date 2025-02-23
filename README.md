# GitTogethers Registration

A modern, responsive web application for handling GitTogethers event registrations.

## Features

- GitHub username validation with profile integration
- Dynamic form with three sections based on user role
- Automatic field population from GitHub profile (email, company name)
- Real-time form validation with inline error messages
- Responsive design with mobile support
- Background mosaic using community images
- Configurable event details through config.yml
- LinkedIn profile URL validation
- Smooth animations and transitions
- Thank you message after form submission

## Configuration

The application uses `config.yml` for configuration. Here's how to configure different aspects:

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
  description: "Description text for closed registrations"
  upcoming:
    - name: "City Name (Date)"
      value: "City Name (Date)"
    # Add more events as needed
```

### Thank You Message
```yaml
thank_you_message: |
  Your multi-line
  thank you message
  goes here
```

## Local Development

1. Clone the repository
2. Open index.html in a web browser
3. For testing without config.yml, the form will display a "Test Event" option

## Form Sections

1. **Section 1**: Basic Information
   - GitTogether event selection
   - Email address
   - City and Country
   - Current Role
   - Company/Organization Name

2. **Section 2**: Professional Details
   - Role/Designation
   - Years of experience
   - LinkedIn profile (Optional)

3. **Section 3**: Additional Information
   - Motivation for attending
   - Underrepresented group identification (Optional)

## Notes

- For students (University/High School), Section 2 is auto-filled with default values
- All form data is submitted to a Google Form endpoint
- Required fields show inline validation messages
- LinkedIn profile URL must be a valid LinkedIn URL
