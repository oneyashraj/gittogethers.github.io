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

// Initialize the check-in page functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // State variables for configuration, events and user data
    let config = null;
    let events = null;
    let userData = null;
    let eventName = null;
    
    // Duplicate prevention tracking
    const submissionKey = 'gittogethers_checkin_submissions';
    
    // Check if user has already submitted for this event
    const hasAlreadySubmitted = (username, eventName) => {
        try {
            const submissions = JSON.parse(localStorage.getItem(submissionKey) || '{}');
            const userSubmissions = submissions[username] || [];
            return userSubmissions.includes(eventName);
        } catch (error) {
            console.error('Error checking submissions:', error);
            return false;
        }
    };
    
    // Record submission
    const recordSubmission = (username, eventName) => {
        try {
            const submissions = JSON.parse(localStorage.getItem(submissionKey) || '{}');
            if (!submissions[username]) {
                submissions[username] = [];
            }
            if (!submissions[username].includes(eventName)) {
                submissions[username].push(eventName);
                localStorage.setItem(submissionKey, JSON.stringify(submissions));
            }
        } catch (error) {
            console.error('Error recording submission:', error);
        }
    };

    // DOM element references
    const usernameInput = document.getElementById('github-username');
    const proceedButton = document.getElementById('proceed-button');
    const errorMessage = document.getElementById('error-message');
    const form = document.getElementById('bootstrapForm');
    const headerContent = document.querySelector('.header-content');
    const logoImage = document.querySelector('.logo-image');
    const heading = document.querySelector('h1');
    const checkinSection = document.getElementById('checkin-section');
    const eventSelection = document.getElementById('event-selection');
    const formContainer = document.querySelector('.form-container');
    
    // Function to check if there are events happening today
    const checkForTodayEvents = () => {
        if (events && events.length > 0) {
            const now = new Date();
            // Check if any event is happening today
            return events.some(event => {
                const eventDate = new Date(event.originalEvent.dateTime);
                return now.getDate() === eventDate.getDate() && 
                       now.getMonth() === eventDate.getMonth() && 
                       now.getFullYear() === eventDate.getFullYear();
            });
        }
        return false;
    };
    
    // Show no events message
    const showNoEventsMessage = () => {
        const content = document.querySelector('.content');
        content.innerHTML = `<div class="thank-you-message">No GitTogethers are happening today. Please check <a href='https://gh.io/meetups'>gh.io/meetups</a> for more information.</div>`;
        formContainer.style.display = 'none';
    };

    // Populate available events for check-in
    // Only shows events scheduled for current day
    const populateGitTogetherChoices = () => {
        const formGroup = document.querySelector('#event-selection .form-group');
        formGroup.innerHTML = '';
        
        if (events && events.length > 0) {
            let hasActiveEvents = false;
            
            // Add event cards for each event
            const now = new Date();
            console.log("Current date:", now.toISOString());
            
            events.forEach(event => {
                const eventDate = new Date(event.originalEvent.dateTime);
                const isSameDay = now.getDate() === eventDate.getDate() && 
                                 now.getMonth() === eventDate.getMonth() && 
                                 now.getFullYear() === eventDate.getFullYear();
                
                // For check-in page, only show events if it's the event day
                if (isSameDay) {
                    hasActiveEvents = true;
                    const card = document.createElement('div');
                    card.className = 'event-card';
                    card.setAttribute('data-event', event.name);
                    card.innerHTML = `
                        <input type="radio" name="selected_event" value="${event.name}" id="event-${event.name.replace(/\s+/g, '-').toLowerCase()}" class="event-radio" required>
                        <label for="event-${event.name.replace(/\s+/g, '-').toLowerCase()}" class="event-card-label">
                            ${event.name}
                        </label>
                    `;
                    formGroup.appendChild(card);
                }
            });

            if (!hasActiveEvents) {
                showNoEventsMessage();
                document.getElementById('checkin-section').style.display = 'none';
            }
        }
    };

    // Display check-in confirmation screen with custom message
    const showThankYouMessage = () => {
        const content = document.querySelector('.content');
        const userName = document.getElementById('766830585').value;
        const firstName = userName.split(' ')[0];
        
        content.innerHTML = `
            <div class="thank-you-screen">
                <div class="logo">
                    <img src="https://octodex.github.com/images/yogitocat.png" alt="Logo" class="logo-image thank-you-logo">
                </div>
                <div class="thank-you-message">
                    ${config.messages.checkin_thank_you.replace('{firstName}', firstName)}
                </div>
            </div>
        `;
    };

    // Validate event selection before form submission
    // Returns true if valid selection or if selection not required
    const validateEventSelection = () => {
        if (eventSelection.style.display !== 'none') {
            const selectedEvent = document.querySelector('input[name="selected_event"]:checked');
            if (!selectedEvent) {
                const formGroup = document.querySelector('#event-selection .form-group');
                showRadioError(formGroup, 'Please select an event');
                return false;
            }
            return true;
        }
        return true; // If event selection is hidden, validation passes
    };

    // Handle form submission
    // Validates GitHub username and event selection before submitting
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Block submission if GitHub username hasn't been validated
        if (!userData) {
            showInputError(usernameInput, 'Please enter your GitHub username first');
            usernameInput.focus();
            return;
        }
        
        // Validate event selection
        if (!validateEventSelection()) {
            return;
        }
        
        // Check for duplicate submission
        const selectedEventRadio = document.querySelector('input[name="selected_event"]:checked');
        const selectedEventName = selectedEventRadio ? selectedEventRadio.value : eventName;
        
        if (hasAlreadySubmitted(userData.login, selectedEventName)) {
            showInputError(usernameInput, 'You have already checked in for this event');
            return;
        }
        
        // Set duplicate check field
        document.getElementById('duplicate_check').value = `${userData.login}_${selectedEventName}_${Date.now()}`;

        // Submit form using jQuery Form plugin
        $('#bootstrapForm').ajaxSubmit({
            url: form.action,
            type: 'POST',
            dataType: 'xml',
            success: function(response) {
                recordSubmission(userData.login, selectedEventName);
                showThankYouMessage();
            },
            error: function() {
                recordSubmission(userData.login, selectedEventName);
                showThankYouMessage();
            }
        });
    });

    // Handle GitHub username submission and initial setup
    // Validates username, fetches user data, and sets up UI
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
                hasRecentActivity: hasRecentCommits
            };

            setLoading(proceedButton, true);

            // Update UI
            logoImage.src = userData.avatar_url;
            heading.innerHTML = `Hello ${userData.login} 👋`;
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
            usernameInput.parentElement.style.display = 'none';
            proceedButton.style.display = 'none';

            // Set form values
            document.getElementById('846479285').value = userData.login;
            document.getElementById('766830585').value = userData.login;

            // Remove form submit handler since it's now handled globally
            form.removeEventListener('submit', handleSubmit);

            // Show check-in section
            checkinSection.style.display = 'block';

            // Handle event selection
            const urlParams = new URLSearchParams(window.location.search);
            const eventParam = urlParams.get('event');
            
            if (eventParam) {
                eventName = eventParam;
                document.getElementById('2076383007').value = eventName;
                // Set event name in tagline
                document.querySelector('.tagline').textContent = eventParam;
                document.getElementById('event-name').textContent = eventParam;
                document.getElementById('event-name').style.display = 'block';
            } else {
                eventSelection.style.display = 'block';
                
                // Display only today's events
                populateGitTogetherChoices();
                
                // Add event listener for event cards
                document.querySelectorAll('.event-card').forEach(card => {
                    const radio = card.querySelector('input[type="radio"]');
                    card.addEventListener('click', () => {
                        // Unselect all other cards
                        document.querySelectorAll('.event-card').forEach(c => c.classList.remove('selected'));
                        // Select this card
                        card.classList.add('selected');
                        // Check the radio button
                        radio.checked = true;
                        // Set the form value
                        document.getElementById('2076383007').value = radio.value;
                        // Don't update tagline when selecting an event
                    });
                });
            }

            return true;
        } catch (error) {
            console.error('Error:', error);
            showInputError(usernameInput, 'Invalid GitHub username');
            return false;
        } finally {
            setLoading(proceedButton, false);
        }
    };

    // Event Listeners
    // Clear error states on input
    usernameInput.addEventListener('input', () => {
        usernameInput.classList.remove('error');
        errorMessage.textContent = '';
    });

    // Handle username submission via button click or Enter key
    proceedButton.addEventListener('click', handleSubmit);
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
    });

    // Initialize page
    // Load configuration and events first
    config = await loadConfig();
    events = await loadEvents();
    
    // Hide the form container immediately if no events
    if (!checkForTodayEvents()) {
        // Hide form elements before any rendering happens
        formContainer.style.display = 'none';
        showNoEventsMessage();
    }
    
    // Setup background after checking events
    await createMosaicBackground(config);
});