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

document.addEventListener('DOMContentLoaded', async () => {
    let config = null;
    let events = null;
    let userData = null;

    const usernameInput = document.getElementById('github-username');
    const proceedButton = document.getElementById('proceed-button');
    const errorMessage = document.getElementById('error-message');
    const form = document.getElementById('bootstrapForm');
    const headerContent = document.querySelector('.header-content');
    const logoImage = document.querySelector('.logo-image');
    const heading = document.querySelector('h1');
    const checkinSection = document.getElementById('checkin-section');
    const eventSelection = document.getElementById('event-selection');

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
                const content = document.querySelector('.content');
                content.innerHTML = `<div class="thank-you-message">No GitTogethers are scheduled at the moment. Please check <a href='https://gh.io/meetups'>gh.io/meetups</a> for more information.</div>`;
                document.getElementById('checkin-section').style.display = 'none';
            }
        }
    };

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
            const displayName = userData.name || userData.login;
            heading.innerHTML = `Hello<span class="editable-name">${displayName}</span> 👋`;
            headerContent.classList.add('compact');

            // Remove any existing name edit links to prevent duplicates
            const existingNameEditLinks = document.querySelector('.name-edit-links');
            if (existingNameEditLinks) {
                existingNameEditLinks.remove();
            }

            // Add name edit links
            const nameEditLinks = document.createElement('div');
            nameEditLinks.className = 'name-edit-links';
            nameEditLinks.innerHTML = `
                <a href="#" class="not-you-link">Not you?</a>
                <a href="#" class="edit-name-link">Edit Name</a>
            `;
            heading.insertAdjacentElement('afterend', nameEditLinks);

            // Add event listeners for name editing
            const editableNameSpan = heading.querySelector('.editable-name');
            const editNameLink = nameEditLinks.querySelector('.edit-name-link');
            const notYouLink = nameEditLinks.querySelector('.not-you-link');
            let originalName = displayName;
            editableNameSpan.setAttribute('data-original-name', originalName);

            const cancelNameEdit = () => {
                editableNameSpan.textContent = originalName;
                editableNameSpan.contentEditable = false;
                editableNameSpan.classList.remove('editing');
                editNameLink.textContent = 'Edit Name';
            };

            const saveNameEdit = () => {
                const newName = editableNameSpan.textContent.trim();
                if (newName) {
                    originalName = newName;
                    editableNameSpan.contentEditable = false;
                    editableNameSpan.classList.remove('editing');
                    editNameLink.textContent = 'Edit Name';
                    document.getElementById('766830585').value = originalName;
                    editableNameSpan.setAttribute('data-original-name', originalName);
                    editableNameSpan.textContent = originalName;
                } else {
                    cancelNameEdit();
                }
            };

            editableNameSpan.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (editNameLink.textContent === 'Save') {
                        saveNameEdit();
                    }
                } else if (e.key === 'Escape') {
                    cancelNameEdit();
                }
            });

            editNameLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (editNameLink.textContent === 'Edit Name') {
                    editableNameSpan.contentEditable = true;
                    editableNameSpan.classList.add('editing');
                    editableNameSpan.focus();
                    const range = document.createRange();
                    range.selectNodeContents(editableNameSpan);
                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);
                    editNameLink.textContent = 'Save';
                } else {
                    saveNameEdit();
                }
            });

            editableNameSpan.addEventListener('blur', (e) => {
                requestAnimationFrame(() => {
                    const activeElement = document.activeElement;
                    if (editNameLink.textContent === 'Save' && 
                        !activeElement?.closest('.name-edit-links') && 
                        activeElement !== editableNameSpan) {
                        cancelNameEdit();
                    }
                });
            });

            notYouLink.addEventListener('click', (e) => {
                e.preventDefault();
                location.reload();
            });

            // Hide username input and proceed button
            usernameInput.parentElement.style.display = 'none';
            proceedButton.style.display = 'none';

            // Set form values
            document.getElementById('846479285').value = userData.login;
            document.getElementById('766830585').value = displayName;

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

            // Add form submit handler
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                // Validate event selection if needed
                if (eventSelection.style.display !== 'none') {
                    const selectedEvent = document.querySelector('input[name="selected_event"]:checked');
                    if (!selectedEvent) {
                        const formGroup = document.querySelector('#event-selection .form-group');
                        showRadioError(formGroup, 'Please select an event');
                        return;
                    }
                }

                // Submit form
                $('#bootstrapForm').ajaxSubmit({
                    url: form.action,
                    type: 'POST',
                    dataType: 'xml',
                    success: function(response) {
                        showThankYouMessage();
                    },
                    error: function() {
                        showThankYouMessage();
                    }
                });
            });

            return true;
        } catch (error) {
            console.error('Error:', error);
            showInputError(usernameInput, 'Invalid GitHub username');
            return false;
        } finally {
            setLoading(proceedButton, false);
        }
    };

    // Add input event listener to clear error state
    usernameInput.addEventListener('input', () => {
        usernameInput.classList.remove('error');
        errorMessage.textContent = '';
    });

    // Event Listeners
    proceedButton.addEventListener('click', handleSubmit);
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
    });

    // Initialize
    config = await loadConfig();
    events = await loadEvents();
    await createMosaicBackground(config);
});