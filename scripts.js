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

    // Section navigation buttons
    const proceedSection1Button = document.getElementById('proceedSection1');
    const backSection2Button = document.getElementById('backSection2');
    const proceedSection2Button = document.getElementById('proceedSection2');
    const backSection3Button = document.getElementById('backSection3');

    // Form sections
    const section1 = document.getElementById('section1');
    const section2 = document.getElementById('section2');
    const section3 = document.getElementById('section3');

    // Error handling helper for config values
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

    const populateGitTogetherChoices = () => {
        const fieldset = document.querySelector('legend[for="1521228078"]').parentElement;
        const formGroup = fieldset.querySelector('.form-group');
        
        formGroup.innerHTML = '';
        
        if (events) {
            let hasActiveEvents = false;
            
            if (events.length > 0) {
                const now = new Date();
                events.forEach(event => {
                    // For registration, use the end_time to filter events
                    const endTime = new Date(event.end_time);
                    
                    // Only show events that haven't reached their end_time yet
                    if (now < endTime) {
                        hasActiveEvents = true;
                        const div = document.createElement('div');
                        div.className = 'radio';
                        div.innerHTML = `
                            <label>
                                <input type="radio" name="entry.1334197574" value="${event.name}" required>
                                ${event.name}
                            </label>
                        `;
                        formGroup.appendChild(div);
                    }
                });
            }

            if (hasActiveEvents) {
                const helpBlock = document.createElement('p');
                helpBlock.className = 'help-block';
                helpBlock.textContent = "Registrations close 2 days before the event.";
                formGroup.insertBefore(helpBlock, formGroup.firstChild);
            } else if (!hasActiveEvents) {
                const content = document.querySelector('.content');
                content.innerHTML = `<div class="thank-you-message">No GitTogethers are scheduled at the moment. Please check <a href='https://gh.io/meetups'>gh.io/meetups</a> for more information.</div>`;
                form.style.display = 'none';
            }
        }
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

    const showSection = (section) => {
        section1.style.display = 'none';
        section2.style.display = 'none';
        section3.style.display = 'none';
        section.style.display = 'block';
    };

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

    const validateSection1 = () => {
        let isValid = true;
        const emailInput = document.getElementById('1294570093');
        
        // Validate email first
        if (!validateEmail(emailInput.value, emailInput)) {
            isValid = false;
        }

        // Continue with other Section 1 validations
        const requiredFields = [
            'entry.1334197574',  // GitTogether event
            'entry.1001119393',  // Full Name
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

    const updateRoleDesignationLegend = () => {
        const companyInput = document.getElementById('1174706497');
        const companyName = companyInput.value.trim();
        const roleDesignationLegend = document.querySelector('legend[for="1835765444"]');
        roleDesignationLegend.textContent = companyName ? `Role/Designation at ${companyName}` : 'Role/Designation';
    };

    // Cache form responses
    const cacheKey = 'gittogethers_form_cache';
    const usernameCacheKey = 'gittogethers_username';
    
    const cacheableFields = {
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
                    // Update the name in the form and data attribute
                    document.getElementById('1001119393').value = originalName;
                    editableNameSpan.setAttribute('data-original-name', originalName);
                    editableNameSpan.textContent = originalName;
                } else {
                    cancelNameEdit();
                }
            };

            editableNameSpan.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault(); // Prevent default Enter behavior
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
                // Only cancel if we clicked outside and not on the save button
                // Use requestAnimationFrame to ensure click events are processed first
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

            // Set the GitHub Username and Full Name
            document.getElementById('1252770814').value = userData.login || '';
            document.getElementById('1001119393').value = displayName;

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

            loadCachedResponses();
            return true;
        } catch (error) {
            console.error('Error:', error);
            showInputError(usernameInput, 'Invalid GitHub username');
            return false;
        }
    };

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
        
        const userName = document.querySelector('.editable-name')?.textContent.trim() || '';
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

    // Event Listeners
    document.querySelectorAll('input[name$=".other_option_response"]').forEach(input => {
        input.addEventListener('focus', () => {
            const radioName = input.name.replace('.other_option_response', '');
            const otherRadio = document.querySelector(`input[name="${radioName}"][value="__other_option__"]`);
            otherRadio.checked = true;
        });
    });

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

        // Cancel name edit if in progress
        const editableNameSpan = document.querySelector('.editable-name');
        const editNameLink = document.querySelector('.edit-name-link');
        if (editNameLink && editNameLink.textContent === 'Save') {
            editableNameSpan.textContent = editableNameSpan.getAttribute('data-original-name');
            editableNameSpan.contentEditable = false;
            editableNameSpan.classList.remove('editing');
            editNameLink.textContent = 'Edit Name';
        }

        // Hide name edit links when leaving section 1
        const nameEditLinks = document.querySelector('.name-edit-links');
        if (nameEditLinks) {
            nameEditLinks.style.display = 'none';
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
        const nameEditLinks = document.querySelector('.name-edit-links');
        if (nameEditLinks) {
            nameEditLinks.style.display = 'flex';
        }
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
            const nameEditLinks = document.querySelector('.name-edit-links');
            if (nameEditLinks) {
                nameEditLinks.style.display = 'flex';
            }
            showSection(section1);
        } else {
            showSection(section2);
        }
    });

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

    // Add homepage class when form is not visible
    const container = document.querySelector('.container');
    if (!document.getElementById('bootstrapForm').style.display || 
        document.getElementById('bootstrapForm').style.display === 'none') {
        container.classList.add('homepage');
    }
    
    // Remove homepage class when form becomes visible
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

    // Initialize
    try {
        config = await loadConfig();
        events = await loadEvents();
        if (!config) {
            throw new Error('Failed to load configuration');
        }
        await createMosaicBackground(config);
        populateGitTogetherChoices();
        addHomepageLinks();
    } catch (error) {
        console.error('Initialization error:', error);
        const content = document.querySelector('.content');
        content.innerHTML = `<div class="thank-you-message">Sorry, we're having trouble loading the application. Please try again later.</div>`;
    }
});