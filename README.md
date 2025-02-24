# GitTogethers Registration Form 🎯

A modern, responsive web application for handling GitTogethers event registrations.

![image](https://github.com/user-attachments/assets/ff3905e1-f48e-4652-beb3-b77cae57612e)

## Key Features ✨
- 🎨 Modern, responsive design optimized for both desktop and mobile
- ⚡ Real-time GitHub username validation
- 📊 Invisible GitHub stats appended to motivation response
- 🔄 Rate-limited API calls to prevent throttling
- 📱 Mobile-optimized error display with auto-scroll
- 💾 Smart form response caching (username-specific)
- 🌟 GitHub Skyline integration with fallback avatar

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

3. **Section 2: Professional Details** 💼 _(Skipped for students)_
   - Role/Designation
   - Years of experience
   - LinkedIn profile URL (Optional)

4. **Section 3: Additional Information** ℹ️
   - Motivation for attending
   - Underrepresented group identification (Optional)

5. **Thank You Screen** 🎉
   - Personalized message with first name
   - Event-specific confirmation date
   - Configurable thank you message with HTML support
   - Side-by-side buttons on desktop (stacked on mobile)
   - GitHub Skyline visualization (fallback to avatar for users with no repos)
   - Smooth fade-in animations for all elements

## Smart Caching 🔄
- Form responses cached per GitHub username
- Cached responses restored only for matching username
- Email field shows "pre-filled" notification when restored
- GitTogether event selection never cached
- Cache cleared on browser data reset

## Configuration ⚙️
The application uses `config.yml` for configuration:

### Background Images 🖼️
```yaml
background_images:
  - https://example.com/image1.webp
  - https://example.com/image2.webp
  # Add more image URLs as needed
```

### GitTogether Events 📅
```yaml
gittogethers:
  description: "Text to display below GitTogether event selection question"
  no_events_message: "Message to show when no events are active"
  upcoming:
    - name: "City Name (Date)"
      end_time: "2025-03-08T17:00:00+05:30"  # Indian Standard Time
      confirmation_date: "2025-03-06T23:59:00+05:30"  # When confirmation emails will be sent
```

### Thank You Message and Buttons 💌
```yaml
thank_you_message: |
  Your message with <a href="mailto:example@example.com">HTML links</a>

thank_you_buttons:
  - text: "Button Text 📢"
    url: "https://example.com"
```

## Dependencies 📦
- 📚 jQuery 3.2.1
- 📝 jQuery Form Plugin 4.2.2
- 📄 js-yaml 4.1.0
- 🔤 Google Fonts (Roboto)

## Browser Support 🌐
- 🌟 Modern browsers with CSS Grid support
- 📱 Flexbox for layouts
- 🎨 CSS custom properties (variables)
- 👁️ Intersection Observer API for animations
