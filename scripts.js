// Import utility functions from shared module
import {
    rateLimiter,
    loadConfig,
    loadEvents,
    createMosaicBackground,
    validateGitHubUsername,
    showInputError,
    showRadioError,
    setLoading
} from './shared.js';

// Initialize the registration page functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // State variables for managing form data and user information
    let config = null;
    let events = null;
    let userData = null;

    // DOM element references
    const usernameInput = document.getElementById('github-username');
    const proceedButton = document.getElementById('proceed-button');
    const errorMessage = document.getElementById('error-message');
    const form = document.getElementById('bootstrapForm');
    const headerContent = document.querySelector('.header-content');
    const logoImage = document.querySelector('.logo-image');
    const heading = document.querySelector('h1');
    const eventSelectionMain = document.getElementById('event-selection-main');
    const loadingState = document.getElementById('loading-state');
    const githubInputSection = document.getElementById('github-input-section');

    // Section navigation buttons
    const proceedSection1Button = document.getElementById('proceedSection1');
    const backSection2Button = document.getElementById('backSection2');
    const proceedSection2Button = document.getElementById('proceedSection2');
    const backSection3Button = document.getElementById('backSection3');

    // Form sections
    const section1 = document.getElementById('section1');
    const section2 = document.getElementById('section2');
    const section3 = document.getElementById('section3');

    // Helper function to safely access nested config values
    const getConfigValue = (path) => {
        try {
            const parts = path.split('.');
            let value = config;
            for (const part of parts) {
                value = value?.[part];
            }
            return value ?? '';
        } catch (error) {
            console.error(`Error accessing config path: ${path}`, error);
            return '';
        }
    };

    // Populate event choices in registration form
    // Only shows events that haven't reached their registration deadline
    const populateGitTogetherChoices = () => {
        const fieldset = document.querySelector('#event-selection-main legend[for="1521228078"]').parentElement;
        const formGroup = fieldset.querySelector('.form-group');
        
        formGroup.innerHTML = '';
        
        if (events) {
            let hasActiveEvents = false;
            
            if (events.length > 0) {
                const now = new Date();
                
                // Filter events that haven't reached their end_time yet
                const availableEvents = events.filter(event => {
                    const endTime = new Date(event.end_time);
                    return now < endTime;
                });

                // First sort all events by date (closest first)
                availableEvents.sort((a, b) => {
                    const dateA = new Date(a.originalEvent.dateTime);
                    const dateB = new Date(b.originalEvent.dateTime);
                    return dateA - dateB;
                });
                
                // Then filter to only keep the closest event for each city
                const cityMap = new Map(); // Map to store closest event for each city
                
                availableEvents.forEach(event => {
                    const cityName = event.originalEvent.title.replace('GitTogether ', '');
                    
                    // If this city isn't in our map yet, or this event is earlier than the one we have, update it
                    if (!cityMap.has(cityName)) {
                        cityMap.set(cityName, event);
                    }
                });
                
                // Convert back to array and re-sort (now with one event per city)
                const filteredEvents = Array.from(cityMap.values());
                
                // Sort by date first, then city name if same date
                filteredEvents.sort((a, b) => {
                    const dateA = new Date(a.originalEvent.dateTime);
                    const dateB = new Date(b.originalEvent.dateTime);
                    
                    // First sort by date
                    if (dateA.getTime() !== dateB.getTime()) {
                        return dateA - dateB;
                    }
                    
                    // If same date, sort by city name alphabetically
                    const cityA = a.originalEvent.title.replace('GitTogether ', '');
                    const cityB = b.originalEvent.title.replace('GitTogether ', '');
                    return cityA.localeCompare(cityB);
                });
                
                // Display the sorted events (one per city)
                hasActiveEvents = filteredEvents.length > 0;
                
                filteredEvents.forEach(event => {
                    // Create event card with countdown
                    const card = document.createElement('div');
                    card.className = 'event-card';
                    card.setAttribute('data-event', event.name);
                    card.setAttribute('data-end-time', event.end_time);
                    const cardId = `event-${event.name.replace(/\s+/g, '-').toLowerCase()}`;
                    
                    // Calculate countdown
                    const endTime = new Date(event.end_time);
                    const timeLeft = endTime - new Date();
                    const countdownText = formatCountdown(timeLeft);
                    
                    card.innerHTML = `
                        <input type="radio" name="entry.1334197574" value="${event.name}" id="${cardId}" class="event-radio" required>
                        <label for="${cardId}" class="event-card-label">
                            <div class="event-card-content">
                                <div class="event-title">${event.name}</div>
                                <div class="event-countdown" data-end-time="${event.end_time}">
                                    ${countdownText}
                                </div>
                            </div>
                        </label>
                    `;
                    formGroup.appendChild(card);
                });

                // Add event listener for event cards
                document.querySelectorAll('.event-card').forEach(card => {
                    const radio = card.querySelector('input[type="radio"]');
                    card.addEventListener('click', () => {
                        // Hide all other cards
                        document.querySelectorAll('.event-card').forEach(c => {
                            if (c !== card) {
                                c.style.display = 'none';
                            }
                        });
                        // Select this card
                        card.classList.add('selected');
                        // Check the radio button
                        radio.checked = true;
                        
                        // Show GitHub input section
                        githubInputSection.style.display = 'block';
                        proceedButton.style.display = 'block';
                        document.getElementById('error-message').style.display = 'block';
                    });
                });
                
                // Start countdown timers
                startCountdownTimers();
            }

            if (hasActiveEvents) {
                const helpBlock = document.createElement('p');
                helpBlock.className = 'help-block';
                helpBlock.textContent = "Registrations close 2 days before the event.";
                formGroup.insertBefore(helpBlock, formGroup.firstChild);
            } else if (!hasActiveEvents) {
                const content = document.querySelector('.content');
                content.innerHTML = `<div class="thank-you-message">No GitTogethers are scheduled at the moment. Please check <a href='https://gh.io/meetups'>gh.io/meetups</a> for more information.</div>`;
                eventSelectionMain.style.display = 'none';
                githubInputSection.style.display = 'none';
            }
        }
    };
    
    // Format countdown timer
    const formatCountdown = (timeLeft) => {
        if (timeLeft <= 0) {
            return 'Registration closed';
        }
        
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) {
            return `${days}d ${hours}h left to register`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m left to register`;
        } else {
            return `${minutes}m left to register`;
        }
    };
    
    // Start countdown timers
    const startCountdownTimers = () => {
        const updateCountdowns = () => {
            document.querySelectorAll('.event-countdown').forEach(countdown => {
                const endTime = new Date(countdown.getAttribute('data-end-time'));
                const timeLeft = endTime - new Date();
                countdown.textContent = formatCountdown(timeLeft);
                
                if (timeLeft <= 0) {
                    const card = countdown.closest('.event-card');
                    card.style.opacity = '0.5';
                    card.style.pointerEvents = 'none';
                }
            });
        };
        
        // Update immediately and then every minute
        updateCountdowns();
        setInterval(updateCountdowns, 60000);
    };

    // Convert all radio groups to card style
    const convertRadioGroupsToCards = () => {
        // Get all radio groups except for the event selection which is handled separately
        const radioGroups = document.querySelectorAll('.form-group');
        
        radioGroups.forEach(group => {
            // Skip if this is the event selection group or doesn't contain radio buttons
            const radios = group.querySelectorAll('input[type="radio"]');
            if (!radios.length || group.closest('#event-selection-main')) {
                return;
            }

            // Store all radio elements and their labels
            const radioElements = [];
            
            radios.forEach(radio => {
                const label = radio.closest('label');
                if (!label) return;
                
                const radioContainer = radio.closest('.radio');
                if (!radioContainer) return;
                
                const inputText = label.textContent.trim();
                const inputValue = radio.value;
                const inputName = radio.name;
                const isOther = inputValue === '__other_option__';
                const otherInput = isOther ? radioContainer.querySelector('input[type="text"]') : null;
                
                radioElements.push({
                    radio,
                    label,
                    container: radioContainer,
                    inputText,
                    inputValue,
                    inputName,
                    isOther,
                    otherInput
                });
            });
            
            // Remove all radio elements from the form group
            radioElements.forEach(el => el.container.remove());
            
            // Add new card style elements
            radioElements.forEach(el => {
                const card = document.createElement('div');
                card.className = 'event-card';
                
                if (el.isOther) {
                    // Mark as other option for easier styling
                    card.classList.add('other-option');
                    
                    const otherClone = el.otherInput.cloneNode(true);
                    const cardId = `${el.inputName.replace(/\./g, '-')}-other`;
                    
                    // Create the card with the Other option
                    card.innerHTML = `
                        <input type="radio" name="${el.inputName}" value="${el.inputValue}" id="${cardId}" class="event-radio">
                        <label for="${cardId}" class="event-card-label">
                            <span class="other-text">Other</span>
                        </label>
                    `;
                    
                    // Create the other input container
                    const otherContainer = document.createElement('div');
                    otherContainer.className = 'other-input';
                    otherContainer.style.display = 'none';
                    otherClone.placeholder = 'Please specify...';
                    otherClone.classList.add('form-control'); // Apply standard form styling
                    
                    // Add the input to the container
                    otherContainer.appendChild(otherClone);
                    card.appendChild(otherContainer);
                    
                    // Handle click on the card
                    card.addEventListener('click', (event) => {
                        // Don't handle if already clicked on the input field
                        if (event.target === otherClone) return;
                        
                        // Unselect all other cards
                        document.querySelectorAll(`.event-card[data-name="${el.inputName}"]`).forEach(c => {
                            c.classList.remove('selected');
                            const otherInput = c.querySelector('.other-input');
                            const otherText = c.querySelector('.other-text');
                            if (otherInput && otherText) {
                                otherInput.style.display = 'none';
                                otherText.style.display = 'block';
                            }
                        });
                        
                        // Select this card
                        card.classList.add('selected');
                        
                        // Check the radio button
                        card.querySelector('input[type="radio"]').checked = true;
                        
                        // Show input and hide text
                        otherContainer.style.display = 'block';
                        card.querySelector('.other-text').style.display = 'none';
                        
                        // Focus the input field immediately
                        setTimeout(() => otherClone.focus(), 10);
                    });
                    
                    // Handle focus on the input field
                    otherClone.addEventListener('focus', () => {
                        // Unselect all other cards
                        document.querySelectorAll(`.event-card[data-name="${el.inputName}"]`).forEach(c => {
                            c.classList.remove('selected');
                            const otherInput = c.querySelector('.other-input');
                            const otherText = c.querySelector('.other-text');
                            if (otherInput && otherText) {
                                otherInput.style.display = 'none';
                                otherText.style.display = 'block';
                            }
                        });
                        
                        // Select this card
                        card.classList.add('selected');
                        
                        // Check the radio button
                        card.querySelector('input[type="radio"]').checked = true;
                        
                        // Show input and hide text
                        otherContainer.style.display = 'block';
                        card.querySelector('.other-text').style.display = 'none';
                    });
                    
                } else {
                    // Regular card (not "Other") 
                    const cardId = `${el.inputValue.replace(/\s+/g, '-').toLowerCase()}-${Math.floor(Math.random() * 1000)}`;
                    card.innerHTML = `
                        <input type="radio" name="${el.inputName}" value="${el.inputValue}" id="${cardId}" class="event-radio">
                        <label for="${cardId}" class="event-card-label">
                            ${el.inputText}
                        </label>
                    `;
                }
                
                // Set data attribute for grouping
                card.setAttribute('data-name', el.inputName);
                
                // Add click handler for regular cards
                if (!el.isOther) {
                    card.addEventListener('click', () => {
                        // Unselect all cards in this group
                        document.querySelectorAll(`.event-card[data-name="${el.inputName}"]`).forEach(c => {
                            c.classList.remove('selected');
                        });
                        
                        // Select this card
                        card.classList.add('selected');
                        
                        // Check the radio
                        card.querySelector('input[type="radio"]').checked = true;
                    });
                }
                
                group.appendChild(card);
            });
        });
    };

    const setLoading = (isLoading) => {
        if (isLoading) {
            proceedButton.textContent = 'Pushing to production..';
            proceedButton.style.opacity = '0.7';
            proceedButton.disabled = true;
        } else {
            proceedButton.textContent = 'Proceed';
            proceedButton.style.opacity = '1';
            proceedButton.disabled = false;
        }
    };

    // Form validation functions
    const validateEmail = (email, input) => {
        // Clear any existing error state
        input.classList.remove('error-input');
        const errorElement = input.nextElementSibling;
        if (errorElement?.classList.contains('error-message')) {
            errorElement.textContent = '';
        }

        // Check for empty field first
        if (!email.trim()) {
            showError(input, 'Email address is required');
            return false;
        }

        // Email regex pattern
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            showError(input, 'Please enter a valid email address');
            return false;
        }

        return true;
    };

    const validateLinkedInUrl = (url) => {
        return url === '' || /^https:\/\/(www\.)?linkedin\.com\/.*$/.test(url);
    };

    // Form section navigation and validation
    const showSection = (section) => {
        section1.style.display = 'none';
        section2.style.display = 'none';
        section3.style.display = 'none';
        section.style.display = 'block';
    };

    // Error handling for form inputs
    const showError = (element, message) => {
        element.classList.add('error-input');
        element.placeholder = message;
        
        // Scroll to error on mobile
        if (window.innerWidth <= 768) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        element.addEventListener('focus', function onFocus() {
            element.classList.remove('error-input');
            element.placeholder = element.getAttribute('data-original-placeholder') || '';
            element.removeEventListener('focus', onFocus);
        }, { once: true });
    };

    const showRadioError = (container, message) => {
        let errorDiv = container.querySelector('.radio-error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'radio-error-message';
            container.appendChild(errorDiv);
        }
        errorDiv.textContent = message;
        errorDiv.classList.add('show');

        // Scroll to error on mobile
        if (window.innerWidth <= 768) {
            container.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const hideRadioError = (container) => {
        const errorDiv = container.querySelector('.radio-error-message');
        if (errorDiv) {
            errorDiv.classList.remove('show');
        }
    };

    // Form section-specific validation
    const validateSection1 = () => {
        let isValid = true;
        
        // Validate event selection first
        const eventRadios = document.querySelectorAll('input[name="entry.1334197574"]');
        const eventContainer = eventRadios[0]?.closest('.form-group');
        const eventChecked = Array.from(eventRadios).some(radio => radio.checked);
        
        if (!eventChecked) {
            showRadioError(eventContainer, 'Please select an event.');
            isValid = false;
        }
        
        // Validate full name
        const fullNameInput = document.getElementById('1001119393');
        if (!fullNameInput.value.trim()) {
            showError(fullNameInput, 'Full name is required');
            isValid = false;
        }
        
        const emailInput = document.getElementById('1294570093');
        
        // Validate email first
        if (!validateEmail(emailInput.value, emailInput)) {
            isValid = false;
        }

        // Continue with other Section 1 validations
        const requiredFields = [
            'entry.2134794723',  // Current Role
            'entry.1174706497',  // Company/Organization
            'entry.1547278427',  // City
            'entry.2043018353',  // Country
        ];

        for (const field of requiredFields) {
            const input = document.querySelector(`[name="${field}"]`);
            if (input.type === 'radio') {
                const radioGroup = document.querySelectorAll(`[name="${field}"]`);
                const container = radioGroup[0].closest('.form-group');
                const checked = Array.from(radioGroup).some(radio => radio.checked);
                const otherRadio = Array.from(radioGroup).find(radio => radio.value === '__other_option__');
                const otherInput = otherRadio && document.querySelector(`[name="${field}.other_option_response"]`);
                
                if (!checked) {
                    showRadioError(container, 'This field is required.');
                    isValid = false;
                } else if (otherRadio?.checked && otherInput && !otherInput.value.trim()) {
                    showError(otherInput, 'This field is required');
                    isValid = false;
                }
            } else if (!input.value.trim()) {
                showError(input, 'This field is required');
                isValid = false;
            }
        }

        return isValid;
    };

    const validateSection2 = () => {
        let isValid = true;
        const requiredFields = [
            'entry.220097591',   // Role/Designation
            'entry.2114391014',  // Years of experience
        ];

        for (const field of requiredFields) {
            const input = document.querySelector(`[name="${field}"]`);
            if (input.type === 'radio') {
                const radioGroup = document.querySelectorAll(`[name="${field}"]`);
                const container = radioGroup[0].closest('.form-group');
                const checked = Array.from(radioGroup).some(radio => radio.checked);
                
                if (!checked) {
                    showRadioError(container, 'This field is required.');
                    isValid = false;
                } else {
                    hideRadioError(container);
                }
            } else if (!input.value.trim()) {
                showError(input, 'This field is required');
                isValid = false;
            }
        }

        const linkedInInput = document.getElementById('1623578350');
        if (linkedInInput.value && !validateLinkedInUrl(linkedInInput.value)) {
            showError(linkedInInput, 'Please enter a valid LinkedIn profile URL');
            isValid = false;
        }

        return isValid;
    };

    const validateSection3 = () => {
        let isValid = true;
        const motivationField = document.getElementById('2085773688');
        const submitButton = document.querySelector('.btn-primary');

        if (!motivationField.value.trim()) {
            motivationField.classList.add('error-input');
            motivationField.setAttribute('data-original-placeholder', motivationField.placeholder);
            motivationField.placeholder = 'This field is required';
            submitButton.classList.remove('ready');
            isValid = false;
        } else {
            motivationField.classList.remove('error-input');
            submitButton.classList.add('ready');
        }
        return isValid;
    };

    // Update role designation field based on company name
    const updateRoleDesignationLegend = () => {
        const companyInput = document.getElementById('1174706497');
        const companyName = companyInput.value.trim();
        const roleDesignationLegend = document.querySelector('legend[for="1835765444"]');
        roleDesignationLegend.textContent = companyName ? `Role/Designation at ${companyName}` : 'Role/Designation';
    };

    // Form response caching functionality
    // Caches user responses per GitHub username for better UX
    const cacheKey = 'gittogethers_form_cache';
    const usernameCacheKey = 'gittogethers_username';
    
    const cacheableFields = {
        // Map of form field IDs to cache keys
        'entry.1294570093': 'email',  // Email Address
        'entry.1547278427': 'city',   // City
        'entry.2043018353': 'country', // Country
        'entry.2134794723': 'role',   // Current Role
        'entry.1174706497': 'company', // Company/Organization
        'entry.220097591': 'designation', // Role/Designation
        'entry.2114391014': 'experience', // Years of experience
        'entry.1623578350': 'linkedin'  // LinkedIn profile
    };

    const loadCachedResponses = () => {
        try {
            const cache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
            const cachedUsername = localStorage.getItem(usernameCacheKey);
            const currentUsername = document.getElementById('1252770814').value;
            
            // Only load cache if username matches
            if (cachedUsername !== currentUsername) {
                return;
            }
            
            // Fill in cached values
            Object.entries(cacheableFields).forEach(([fieldName, cacheKey]) => {
                const value = cache[cacheKey];
                if (!value) return;

                const input = document.querySelector(`[name="${fieldName}"]`);
                if (!input) return;

                if (input.type === 'radio') {
                    // Handle radio buttons
                    const radioGroup = document.querySelectorAll(`[name="${fieldName}"]`);
                    const matchingRadio = Array.from(radioGroup).find(radio => radio.value === value);
                    if (matchingRadio) {
                        matchingRadio.checked = true;
                    } else if (value.startsWith('__other_option__:')) {
                        // Handle "Other" option
                        const otherValue = value.replace('__other_option__:', '');
                        const otherRadio = Array.from(radioGroup).find(radio => radio.value === '__other_option__');
                        const otherInput = document.querySelector(`[name="${fieldName}.other_option_response"]`);
                        if (otherRadio && otherInput) {
                            otherRadio.checked = true;
                            otherInput.value = otherValue;
                        }
                    }
                } else {
                    // Handle text inputs
                    input.value = value;
                    
                    // Special handling for email field
                    if (fieldName === 'entry.1294570093' && value) {
                        const helpBlock = input.closest('.form-group').querySelector('.help-block');
                        if (helpBlock) {
                            helpBlock.textContent = "If you're selected, we'll send you a confirmation email. Your previous response is pre-filled. Edit if needed.";
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error loading cached responses:', error);
        }
    };

    const cacheFormResponses = () => {
        try {
            const cache = {};
            const currentUsername = document.getElementById('1252770814').value;
            
            Object.entries(cacheableFields).forEach(([fieldName, cacheKey]) => {
                const input = document.querySelector(`[name="${fieldName}"]`);
                if (!input) return;

                if (input.type === 'radio') {
                    // Handle radio buttons
                    const checkedRadio = document.querySelector(`[name="${fieldName}"]:checked`);
                    if (checkedRadio) {
                        if (checkedRadio.value === '__other_option__') {
                            const otherInput = document.querySelector(`[name="${fieldName}.other_option_response"]`);
                            if (otherInput && otherInput.value) {
                                cache[cacheKey] = `__other_option__:${otherInput.value}`;
                            }
                        } else {
                            cache[cacheKey] = checkedRadio.value;
                        }
                    }
                } else {
                    // Handle text inputs
                    cache[cacheKey] = input.value;
                }
            });

            localStorage.setItem(cacheKey, JSON.stringify(cache));
            localStorage.setItem(usernameCacheKey, currentUsername);
        } catch (error) {
            console.error('Error caching form responses:', error);
        }
    };

    // Handle GitHub username submission and form initialization
    const handleSubmit = async (event) => {
        event?.preventDefault();
        
        const username = usernameInput.value.trim();
        errorMessage.textContent = '';
        usernameInput.classList.remove('error');
        
        if (!username) {
            showInputError(usernameInput, 'Please enter your GitHub username');
            return;
        }

        try {
            userData = await validateGitHubUsername(username);
            
            // Fetch additional GitHub stats
            const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?type=public`);
            const repos = await reposResponse.json();
            
            // Get commit activity for the last year
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            
            // Check for commits in the last year using events API
            const eventsResponse = await fetch(`https://api.github.com/users/${username}/events/public`);
            const events = await eventsResponse.json();
            const hasRecentCommits = events.some(event => 
                event.type === 'PushEvent' && 
                new Date(event.created_at) > oneYearAgo
            );
            
            // Store GitHub stats for later use
            userData.stats = {
                publicRepos: userData.public_repos,
                followers: userData.followers,
                hasRecentActivity: hasRecentCommits
            };

            setLoading(true);

            // Update UI
            logoImage.src = userData.avatar_url;
            heading.innerHTML = `Hello there 👋`;
            headerContent.classList.add('compact');

            // Add "Not you?" link
            const notYouLink = document.createElement('div');
            notYouLink.className = 'name-edit-links';
            notYouLink.innerHTML = `<a href="#" class="not-you-link">Not you?</a>`;
            heading.insertAdjacentElement('afterend', notYouLink);
            
            notYouLink.querySelector('.not-you-link').addEventListener('click', (e) => {
                e.preventDefault();
                location.reload();
            });

            // Hide username input and proceed button
            githubInputSection.style.display = 'none';
            proceedButton.style.display = 'none';
            document.getElementById('error-message').style.display = 'none';
            eventSelectionMain.style.display = 'none';

            // Set the GitHub Username and Full Name
            document.getElementById('1252770814').value = userData.login || '';

            // Auto-fill email if available
            if (userData.email) {
                document.getElementById('1294570093').value = userData.email;
            }

            // Auto-fill company if available
            const companyInput = document.getElementById('1174706497');
            if (userData.company) {
                // Remove @ if present at the start
                companyInput.value = userData.company.replace(/^@/, '');
                updateRoleDesignationLegend();
            }

            // Add event listener for company name changes
            companyInput.addEventListener('input', updateRoleDesignationLegend);

            setLoading(false);
            form.style.display = 'block';
            showSection(section1);
            convertRadioGroupsToCards(); // Convert all radio groups to cards after form is shown
            
            loadCachedResponses();
            return true;
        } catch (error) {
            console.error('Error:', error);
            showInputError(usernameInput, 'Invalid GitHub username');
            return false;
        }
    };

    // Form submission handler with GitHub stats integration
    const submitForm = () => {
        if (!validateSection3()) {
            return;
        }

        // Get the original motivation text
        const motivationField = document.getElementById('2085773688');
        const originalValue = motivationField.value.trim();
        let submissionValue = originalValue;

        try {
            // Safely append GitHub stats if available
            if (userData?.stats && 
                typeof userData.stats.publicRepos === 'number' && 
                typeof userData.stats.followers === 'number') {
                // Append stats in the same line with a separator
                const statsText = ` | ${userData.stats.publicRepos} public repos | ${userData.stats.followers} followers`;
                submissionValue = originalValue + statsText;
            }
        } catch (error) {
            console.error('Error appending GitHub stats:', error);
            submissionValue = originalValue;
        }

        // Set the submission value to the form field without showing it to the user
        const tempMotivationField = document.createElement('textarea');
        tempMotivationField.style.display = 'none';
        tempMotivationField.name = motivationField.name;
        tempMotivationField.value = submissionValue;
        motivationField.parentNode.appendChild(tempMotivationField);
        motivationField.removeAttribute('name');

        // Remove required attribute from LinkedIn field before submission
        const linkedInInput = document.getElementById('1623578350');
        linkedInInput.removeAttribute('required');

        // Use jQuery form plugin for submission
        $('#bootstrapForm').ajaxSubmit({
            url: form.action,
            type: 'POST',
            dataType: 'xml',
            success: function(response) {
                showThankYouMessage();
            },
            error: function() {
                showThankYouMessage();
            },
            complete: function() {
                // Clean up
                motivationField.setAttribute('name', tempMotivationField.name);
                tempMotivationField.remove();
            }
        });

        cacheFormResponses();
    };

    // Add quick access links to homepage
    const addHomepageLinks = () => {
        if (!config?.thank_you_buttons) return;
        
        // Remove any existing homepage links
        const existingLinks = document.querySelector('.homepage-links');
        if (existingLinks) {
            existingLinks.remove();
        }
        
        const links = document.createElement('div');
        links.className = 'homepage-links';
        links.innerHTML = config.thank_you_buttons
            .map(button => `<a href="${button.url}" target="_blank" rel="noopener noreferrer">${button.text}</a>`)
            .join('');
        
        // Add links after the form container
        document.querySelector('.form-container').insertAdjacentElement('afterend', links);
    };

    // Display thank you message after successful registration
    const showThankYouMessage = () => {
        const content = document.querySelector('.content');
        const selectedEvent = document.querySelector('input[name="entry.1334197574"]:checked');
        const eventName = selectedEvent?.value || '';
        const event = events?.find(e => e.name === eventName);
        const confirmationTime = event ? new Date(event.confirmation_time) : null;
        const formattedDate = confirmationTime ? confirmationTime.toLocaleString('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).replace(' at', '').replace(',', '') : '';
        
        const userName = document.getElementById('1001119393')?.value.trim() || '';
        const firstName = userName.split(' ')[0];

        const thankYouMessage = getConfigValue('messages.thank_you_message');
        const thankYouButtons = getConfigValue('thank_you_buttons') || [];

        content.innerHTML = `
            <div class="thank-you-screen">
                <div class="logo">
                    <img src="https://octodex.github.com/images/yogitocat.png" alt="Logo" class="logo-image thank-you-logo">
                </div>
                <div class="thank-you-message">
                    Thank you for registering for GitTogether ${eventName}, ${firstName}!
                    ${formattedDate ? `\n\nIf you're selected, we'll send you a confirmation email for this meetup by ${formattedDate}.` : ''}
                    ${thankYouMessage ? `\n\n${thankYouMessage}` : ''}
                </div>
                ${thankYouButtons.length > 0 ? `
                    <div class="thank-you-buttons">
                        ${thankYouButtons.map(button => 
                            `<a href="${button.url}" target="_blank" rel="noopener noreferrer" title="${button.text}">${button.text}</a>`
                        ).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    };

    // Event listeners for form interactivity
    // Radio button "Other" option handling
    document.querySelectorAll('input[name$=".other_option_response"]').forEach(input => {
        input.addEventListener('focus', () => {
            const radioName = input.name.replace('.other_option_response', '');
            const otherRadio = document.querySelector(`input[name="${radioName}"][value="__other_option__"]`);
            otherRadio.checked = true;
        });
    });

    // Section navigation button handlers
    proceedButton.addEventListener('click', handleSubmit);
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
    });

    proceedSection1Button.addEventListener('click', () => {
        if (!validateSection1()) {
            return;
        }

        const currentRole = document.querySelector('input[name="entry.2134794723"]:checked');
        if (currentRole && (currentRole.value === 'University Student' || currentRole.value === 'High School Student')) {
            document.getElementById('220097591').value = 'N/A';
            const yearsExpRadio = document.querySelector('input[name="entry.2114391014"][value="0 to 2 years"]');
            if (yearsExpRadio) {
                yearsExpRadio.checked = true;
            }
            showSection(section3);
        } else {
            showSection(section2);
        }
    });

    backSection2Button.addEventListener('click', () => {
        showSection(section1);
    });

    proceedSection2Button.addEventListener('click', () => {
        if (!validateSection2()) {
            return;
        }
        showSection(section3);
    });

    backSection3Button.addEventListener('click', () => {
        const currentRole = document.querySelector('input[name="entry.2134794723"]:checked');
        if (currentRole && (currentRole.value === 'University Student' || currentRole.value === 'High School Student')) {
            showSection(section1);
        } else {
            showSection(section2);
        }
    });

    // Form submission and validation
    form.addEventListener('submit', function (event) {
        event.preventDefault();
        submitForm();
    });

    // Add event listeners for radio buttons
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const name = radio.getAttribute('name');
            const container = radio.closest('.form-group');
            hideRadioError(container);
            
            // If this is not the "other" option, also clear any error on the other input
            if (radio.value !== '__other_option__') {
                const otherInput = container.querySelector(`input[name="${name}.other_option_response"]`);
                if (otherInput) {
                    otherInput.classList.remove('error-input');
                    otherInput.placeholder = otherInput.getAttribute('data-original-placeholder') || '';
                }
            }
        });
    });

    // Add event listeners for motivation field
    document.getElementById('2085773688').addEventListener('input', (e) => {
        if (e.target.value.trim()) {
            e.target.classList.remove('error-input');
            e.target.placeholder = e.target.getAttribute('data-original-placeholder') || '';
        }
    });

    document.getElementById('2085773688').addEventListener('focus', function onFocus() {
        if (this.classList.contains('error-input')) {
            this.classList.remove('error-input');
            this.placeholder = this.getAttribute('data-original-placeholder') || '';
        }
    });

    // Add event listeners for role selection
    document.querySelectorAll('input[name="entry.2134794723"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const companyLegend = document.querySelector('legend[for="913513785"]');
            const companyInput = document.getElementById('1174706497');
            
            switch(radio.value) {
                case 'University Student':
                    companyLegend.textContent = 'College/University Name';
                    companyInput.placeholder = 'Enter your college/university name';
                    break;
                case 'High School Student':
                    companyLegend.textContent = 'School Name';
                    companyInput.placeholder = 'Enter your school name';
                    break;
                default:
                    companyLegend.textContent = 'Company/Organisation Name';
                    companyInput.placeholder = '';
            }
        });
    });

    // Add input event listener to clear error state
    usernameInput.addEventListener('input', () => {
        usernameInput.classList.remove('error');
        errorMessage.textContent = '';
    });

    // Add responsive behavior for homepage layout
    const container = document.querySelector('.container');
    if (!document.getElementById('bootstrapForm').style.display || 
        document.getElementById('bootstrapForm').style.display === 'none') {
        container.classList.add('homepage');
    }
    
    // Watch for form visibility changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.style.display === 'block') {
                container.classList.remove('homepage');
            }
        });
    });
    
    observer.observe(document.getElementById('bootstrapForm'), {
        attributes: true,
        attributeFilter: ['style']
    });

    // Initialize page
    // Load configuration, events and setup UI
    try {
        // Show loading state
        loadingState.style.display = 'block';
        
        config = await loadConfig();
        events = await loadEvents();
        if (!config) {
            throw new Error('Failed to load configuration');
        }
        await createMosaicBackground(config);
        populateGitTogetherChoices();
        addHomepageLinks();
        
        // Hide loading state and show content
        loadingState.style.display = 'none';
        eventSelectionMain.style.display = 'block';
    } catch (error) {
        console.error('Initialization error:', error);
        loadingState.style.display = 'none';
        const content = document.querySelector('.content');
        content.innerHTML = `<div class="thank-you-message">Sorry, we're having trouble loading the application. Please try again later.</div>`;
    }
});