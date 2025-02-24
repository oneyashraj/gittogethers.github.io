# GitTogethers Registration

A modern, responsive web application for handling GitTogethers event registrations.

![image](https://github.com/user-attachments/assets/95e71204-001f-475c-946a-a03073ae69b0)

## Key Features ✨
- 🎨 Modern, responsive design
- ⚡ GitHub username validation
- 🔄 Optimized API calls with rate limiting
- 📱 Mobile-optimized error display with auto-scroll
- 💾 Form response caching (username-specific)
- 📊 GitHub Skyline integration with fallback avatar
- 🌟 CSS Grid support, Flexbox for layouts and CSS custom properties (variables)
- 👁️ Intersection Observer API for animations

## Code Organization 📁
The codebase is organized into modular components:

### JavaScript Modules 📦
- `shared.js`: Common utilities and functions
  - Rate limiting for API calls
  - Config loading
  - Background mosaic creation
  - GitHub username validation
  - Error handling utilities
  - Loading state management

- `checkin.js`: Check-in specific functionality
  - Form handling
  - Event selection
  - GitHub profile integration
  - Name editing
  - Form submission

### Configuration (config.yml) ⚙️
```yaml
# Background images for mosaic
background_images:
  - image_url_1
  - image_url_2
  # ...

# Messages and notifications
messages:
  no_events: "Message when no events are available"
  checkin_thank_you: "Check-in confirmation message"
  thank_you: "Post-registration message"

# GitTogether event configuration
gittogethers:
  description: "Event registration info"
  upcoming:
    - name: "Event Name"
      end_time: "Event end time"
      confirmation_date: "When confirmation emails will be sent"

# Post-registration action buttons
thank_you_buttons:
  - text: "Button text"
    url: "Button URL"
```

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
   - Event-specific confirmation date
   - Configurable thank you message with HTML support
   - GitHub Skyline visualization (fallback to avatar for users with no repos)
   - Smooth fade-in animations for all elements

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
4. Update `config.yml` to configure events and messages

## Security 🔒
- Rate limiting on GitHub API calls
- Form validation and sanitization
- No sensitive data stored in localStorage
- HTTPS required for GitHub API calls

