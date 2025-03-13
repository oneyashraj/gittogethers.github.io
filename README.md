# GitTogethers Registration and Check-in

A modern, responsive web application for handling GitTogethers event registrations.

![image](https://github.com/user-attachments/assets/f57c03ff-3955-4fd2-891c-833106bc4b77)

![image](https://github.com/user-attachments/assets/417b671a-820c-4ec5-9054-b190b1c31ab7)

## Key Features ✨
- 🎨 Modern, responsive design
- ⚡ GitHub username validation
- 🔄 Optimized API calls with rate limiting
- 📱 Mobile-optimized error display with auto-scroll
- 💾 Form response caching (username-specific)
- 🌟 CSS Grid support, Flexbox for layouts and CSS custom properties (variables)
- 👁️ Intersection Observer API for animations

## User Interface 🖥️
1. **Homepage** 🏠
   - GitHub username validation from API
   - Quick access links at bottom (same style as name edit links)

2. **Section 1: Basic Information** 📝
   - Profile picture and name display from GitHub API
   - Name editing feature
   - GitTogether event selection (time-based visibility)
   - Email address (with cache restore notification)
   - City (with "Other" option)
   - Country (with "Other" option)
   - Current Role
   - Company/Organization Name
   - Form responses cached per GitHub username
   - Cached responses restored only for matching username
   - Cache cleared on browser data reset

3. **Section 2: Professional Details** 💼 _(Skipped for students)_
   - Role/Designation
   - Years of experience
   - LinkedIn profile URL (Optional)

4. **Section 3: Additional Information** ℹ️
   - Motivation for attending
   - Underrepresented group identification (Optional)
   - GitHub stats (number of repos and followers) appended to form response

5. **Thank You Screen** 🎉
   - Personalized message with first name
   - Event-specific confirmation time
   - Configurable thank you message with HTML support
   - Smooth fade-in animations for all elements

## Event Handling System 📋
- Events are loaded from `data/events.json`
- Each event contains basic details like title, dateTime, description, and venue
- The system calculates important date information programmatically:
  - **End Time**: Registration ends at 5 PM IST 2 days before the event
  - **Confirmation Time**: Confirmation emails sent by 11:59 PM IST 2 days before the event
- **Check-in page**: Events are only visible on the actual event day
- **Registration page**: Events are visible until the registration end time

## Code Organization 📁
The codebase is organized into modular components:

### JavaScript Modules 📦
- `shared.js`: Common utilities and functions
  - Rate limiting for API calls
  - Config loading from data directory
  - Events loading from JSON file
  - Background mosaic creation
  - GitHub username validation
  - Error handling utilities
  - Loading state management

- `scripts.js`: Registration functionality
  - Form handling
  - Event selection
  - GitHub profile integration
  - Name editing with duplicate prevention
  - Form submission
  
- `checkin.js`: Check-in specific functionality
  - Same-day event visibility logic
  - GitHub profile integration
  - Name editing with duplicate prevention
  - Form submission

### Configuration (data/config.yml) ⚙️
```yaml
# Messages and notifications
messages:
  checkin_thank_you: "Check-in confirmation message"
  thank_you_message: "Post-registration message with HTML support"

# Post-registration action buttons
thank_you_buttons:
  - text: "Button text"
    url: "Button URL"

# Background images for mosaic
background_images:
  - image_url_1
  - image_url_2
  # ...
```

## Dependencies 📦
- 📚 jQuery 3.7.1
- 📝 jQuery Form Plugin 4.3.0
- 📄 js-yaml 4.1.0
- 🔤 Google Fonts (Roboto)

## Browser Support 🌐
- Modern browsers with ES6 module support
- CSS Grid and Flexbox support
- Fallbacks for GitHub Skyline visualization

## Development 💻
1. Clone the repository
2. No build process required - pure HTML, CSS, and JavaScript
3. Serve the files using any web server
4. Update `data/config.yml` to configure messages and buttons
5. Update `data/events.json` to manage upcoming events

