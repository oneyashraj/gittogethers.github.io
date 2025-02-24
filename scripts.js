document.addEventListener('DOMContentLoaded', () => {
    // Rate limiting implementation
    const rateLimiter = {
        lastCall: 0,
        minInterval: 1000, // 1 second between calls
        async throttle(fn) {
            const now = Date.now();
            const timeToWait = Math.max(0, this.lastCall + this.minInterval - now);
            
            if (timeToWait > 0) {
                await new Promise(resolve => setTimeout(resolve, timeToWait));
            }
            
            try {
                const result = await fn();
                this.lastCall = Date.now(); // Update after successful execution
                return result;
            } catch (error) {
                // Don't update lastCall on error to allow immediate retry
                throw error;
            }
        }
    };

    let config = null;
    let userData = null;

    // Shared utility functions
    const utils = {
        async loadConfig() {
        try {
            const response = await fetch('config.yml');
            const yamlText = await response.text();
            config = jsyaml.load(yamlText);
            return config;
        } catch (error) {
            console.error('Error loading config:', error);
            return null;
        }
        },

        async createMosaicBackground() {
        try {
            const mosaicContainer = document.createElement('div');
            mosaicContainer.className = 'background-mosaic';
            document.body.insertBefore(mosaicContainer, document.body.firstChild);

            // Check localStorage first
            const cachedImages = localStorage.getItem('mosaicImages');
            let images;
            
            if (cachedImages) {
                images = JSON.parse(cachedImages);
            } else {
                images = config.background_images;
                localStorage.setItem('mosaicImages', JSON.stringify(images));
            }

            // Shuffle and select only 9 images
            const shuffledImages = [...images]
                .sort(() => Math.random() - 0.5)
                .slice(0, 9);

            // Load all images first
            const imageLoadPromises = shuffledImages.map(src => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = reject;
                    img.src = src;
                });
            });

            // Wait for all images to load
            const loadedImages = await Promise.all(imageLoadPromises);

            // Create 9 image elements in a grid
            loadedImages.forEach((img, i) => {
                const newImg = document.createElement('img');
                newImg.src = img.src;
                newImg.className = 'mosaic-image';
                newImg.alt = '';
                mosaicContainer.appendChild(newImg);
            });

            // Show the mosaic after everything is ready
            requestAnimationFrame(() => {
                mosaicContainer.classList.add('initialized');
            });

        } catch (error) {
            console.error('Error loading background images:', error);
        }
        },

        populateGitTogetherChoices(container, onSelect = null) {
            const formGroup = container.querySelector('.form-group');
        formGroup.innerHTML = '';
        
        if (config && config.gittogethers) {
            let hasActiveEvents = false;
            
            // Add radio buttons for each event
            if (config.gittogethers.upcoming && config.gittogethers.upcoming.length > 0) {
                const now = new Date();
                config.gittogethers.upcoming.forEach(event => {
                    const endTime = new Date(event.end_time);
                    
                    // Only show events that haven't ended
                    if (now <= endTime) {
                        hasActiveEvents = true;
                        const div = document.createElement('div');
                        div.className = 'radio';
                        div.innerHTML = `
                            <label>
                                    <input type="radio" name="selected_event" value="${event.name}" required>
                                ${event.name}
                            </label>
                        `;
                        formGroup.appendChild(div);
                    }
                });

                    // Add event listeners if callback provided
                    if (onSelect) {
                        formGroup.querySelectorAll('input[name="selected_event"]').forEach(radio => {
                            radio.addEventListener('change', () => onSelect(radio.value));
                        });
                    }
                }

                if (!hasActiveEvents) {
                const content = document.querySelector('.content');
                content.innerHTML = `<div class="thank-you-message">${config.gittogethers.no_events_message}</div>`;
                    return false;
                }

                return true;
            }
        },

        async validateGitHubUsername(username) {
            // Basic validation before API call
            if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(username)) {
                throw new Error('Invalid username format');
            }
            
            return rateLimiter.throttle(async () => {
                const response = await fetch(`https://api.github.com/users/${username}`);
                if (response.status === 404) {
                    throw new Error('Username not found');
                } else if (!response.ok) {
                    throw new Error('GitHub API error');
                }
                return response.json();
            });
        },

        showInputError(input, message) {
            const originalPlaceholder = input.placeholder;
            
            input.classList.add('error');
            input.value = '';
            input.placeholder = message;
            
            // Reset the input state after animation
            setTimeout(() => {
                input.classList.remove('error');
                input.placeholder = originalPlaceholder;
            }, 2000);
        },

        showRadioError(container, message) {
        let errorDiv = container.querySelector('.radio-error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'radio-error-message';
            container.appendChild(errorDiv);
        }
        errorDiv.textContent = message;
        errorDiv.classList.add('show');

        if (window.innerWidth <= 768) {
            container.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        },

        hideRadioError(container) {
        const errorDiv = container.querySelector('.radio-error-message');
        if (errorDiv) {
            errorDiv.classList.remove('show');
        }
        },

        setupNameEditing(nameSpan, editLink, onSave) {
            let originalName = nameSpan.textContent;
            nameSpan.setAttribute('data-original-name', originalName);

            const cancelEdit = () => {
                nameSpan.textContent = originalName;
                nameSpan.contentEditable = false;
                nameSpan.classList.remove('editing');
                editLink.textContent = 'Edit Name';
            };

            const saveEdit = () => {
                const newName = nameSpan.textContent.trim();
                if (newName) {
                    originalName = newName;
                    nameSpan.contentEditable = false;
                    nameSpan.classList.remove('editing');
                    editLink.textContent = 'Edit Name';
                    nameSpan.setAttribute('data-original-name', originalName);
                    nameSpan.textContent = originalName;
                    if (onSave) onSave(originalName);
                } else {
                    cancelEdit();
                }
            };

            nameSpan.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (editLink.textContent === 'Save') {
                        saveEdit();
                    }
                } else if (e.key === 'Escape') {
                    cancelEdit();
                }
            });

            editLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (editLink.textContent === 'Edit Name') {
                    nameSpan.contentEditable = true;
                    nameSpan.classList.add('editing');
                    nameSpan.focus();
                    const range = document.createRange();
                    range.selectNodeContents(nameSpan);
                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);
                    editLink.textContent = 'Save';
                } else {
                    saveEdit();
                }
            });

            nameSpan.addEventListener('blur', (e) => {
                requestAnimationFrame(() => {
                    const activeElement = document.activeElement;
                    if (editLink.textContent === 'Save' && 
                        !activeElement?.closest('.name-edit-links') && 
                        activeElement !== nameSpan) {
                        cancelEdit();
                    }
                });
            });

            return { cancelEdit, saveEdit };
        },

        async checkGitHubActivity(username) {
            try {
                // Get user's events for the last year
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                
                // First check if user has any public repos
                if (!userData?.public_repos || userData.public_repos === 0) {
                    return false;
                }

                // Get user's events
                const response = await fetch(`https://api.github.com/users/${username}/events/public`);
                if (!response.ok) {
                    return false;
                }

                const events = await response.json();
                
                // Filter push events from last year
                const pushEvents = events.filter(event => {
                    const eventDate = new Date(event.created_at);
                    return event.type === 'PushEvent' && eventDate > oneYearAgo;
                });

                return pushEvents.length > 0;
        } catch (error) {
                console.error('Error checking GitHub activity:', error);
            return false;
            }
        },

        async createSkylineViewer(container, username, fallbackImageUrl) {
        const today = new Date().toISOString().split('T')[0];
            const hasActivity = await this.checkGitHubActivity(username);
            
            if (hasActivity) {
                const skylineContainer = container.querySelector('.skyline-container');
            const fallbackImage = skylineContainer.querySelector('img');
            const iframe = document.createElement('iframe');
            
                iframe.src = `https://skyline3d.in/${username}/embed?endDate=${today}&enableZoom=true`;
            iframe.width = '100%';
            iframe.height = '100%';
            iframe.frameBorder = '0';
            iframe.title = 'GitHub Skyline';
            iframe.style.display = 'none';
            
            // Show skyline only when loaded
            iframe.onload = () => {
                requestAnimationFrame(() => {
                    skylineContainer.classList.remove('loading');
                    fallbackImage.style.display = 'none';
                    iframe.style.display = 'block';
                });
            };
            
            // Show fallback on error or if loading takes too long
            iframe.onerror = () => {
                skylineContainer.classList.remove('loading');
                fallbackImage.style.display = 'block';
                iframe.remove();
            };

            // Fallback if loading takes too long
            setTimeout(() => {
                if (skylineContainer.classList.contains('loading')) {
                    skylineContainer.classList.remove('loading');
                    fallbackImage.style.display = 'block';
                    iframe.remove();
                }
            }, 10000); // 10 seconds timeout
            
            skylineContainer.appendChild(iframe);
        } else {
                // Show app avatar for users with no activity
                const skylineContainer = container.querySelector('.skyline-container');
            const fallbackImage = skylineContainer.querySelector('img');
            skylineContainer.classList.remove('loading');
            fallbackImage.style.display = 'block';
            }
        }
    };

    // Page-specific initialization
    const initializePage = async () => {
        await utils.loadConfig();
        await utils.createMosaicBackground();

        // Check if this is the check-in page
        const isCheckinPage = document.location.pathname.includes('checkin.html');
        
        if (isCheckinPage) {
            // Initialize check-in page
            const CheckinPage = {
                elements: {
                    usernameInput: document.getElementById('github-username'),
                    proceedButton: document.getElementById('proceed-button'),
                    errorMessage: document.getElementById('error-message'),
                    form: document.getElementById('bootstrapForm'),
                    headerContent: document.querySelector('.header-content'),
                    logoImage: document.querySelector('.logo-image'),
                    heading: document.querySelector('h1'),
                    checkinSection: document.getElementById('checkin-section'),
                    eventSelection: document.getElementById('event-selection'),
                    eventName: document.getElementById('event-name')
                },

                setLoading(isLoading) {
                    const button = this.elements.proceedButton;
                    if (isLoading) {
                        button.textContent = 'Pushing to production..';
                        button.style.opacity = '0.7';
                        button.disabled = true;
                    } else {
                        button.textContent = 'Proceed';
                        button.style.opacity = '1';
                        button.disabled = false;
                    }
                },

                showThankYouMessage() {
                    const content = document.querySelector('.content');
                    const userName = document.getElementById('766830585').value;
                    const firstName = userName.split(' ')[0];
                    const githubUsername = document.getElementById('846479285').value;
                    
                    content.innerHTML = `
                        <div class="thank-you-screen">
                            <div class="skyline-container loading">
                                <img src="https://avatars.githubusercontent.com/u/98106734?s=200&v=4" alt="Logo" style="display: none;">
                            </div>
                            <div class="thank-you-message">
                                ${config.gittogethers.checkin_thank_you_message.replace('{firstName}', firstName)}
                            </div>
                            <div class="thank-you-buttons">
                                ${config.thank_you_buttons.map(button => 
                                    `<a href="${button.url}" target="_blank" rel="noopener noreferrer" title="${button.text}">${button.text}</a>`
                                ).join('')}
                            </div>
                        </div>
                    `;

                    utils.createSkylineViewer(content, githubUsername, 'https://avatars.githubusercontent.com/u/98106734?s=200&v=4');
                },

                async handleSubmit(event) {
                    event?.preventDefault();
                    
                    const username = this.elements.usernameInput.value.trim();
                    this.elements.errorMessage.textContent = '';
                    this.elements.usernameInput.classList.remove('error');
                    
                    if (!username) {
                        utils.showInputError(this.elements.usernameInput, 'Please enter your GitHub username');
            return;
        }

                    try {
                        userData = await utils.validateGitHubUsername(username);
                        this.setLoading(true);

                        // Update UI
                        this.elements.logoImage.src = userData.avatar_url;
                        const displayName = userData.name || userData.login;
                        this.elements.heading.innerHTML = `Hello<span class="editable-name">${displayName}</span> 👋`;
                        this.elements.headerContent.classList.add('compact');

                        // Add name edit links
                        const nameEditLinks = document.createElement('div');
                        nameEditLinks.className = 'name-edit-links';
                        nameEditLinks.innerHTML = `
                            <a href="#" class="not-you-link">Not you?</a>
                            <a href="#" class="edit-name-link">Edit Name</a>
                        `;
                        this.elements.heading.insertAdjacentElement('afterend', nameEditLinks);

                        // Setup name editing
                        const editableNameSpan = this.elements.heading.querySelector('.editable-name');
                        const editNameLink = nameEditLinks.querySelector('.edit-name-link');
                        const notYouLink = nameEditLinks.querySelector('.not-you-link');

                        utils.setupNameEditing(editableNameSpan, editNameLink, (newName) => {
                            document.getElementById('766830585').value = newName;
                        });

                        notYouLink.addEventListener('click', (e) => {
                            e.preventDefault();
                            location.reload();
                        });

                        // Hide username input and proceed button
                        this.elements.usernameInput.parentElement.style.display = 'none';
                        this.elements.proceedButton.style.display = 'none';

                        // Set form values
                        document.getElementById('846479285').value = userData.login;
                        document.getElementById('766830585').value = displayName;

                        // Show check-in section
                        this.elements.checkinSection.style.display = 'block';

                        // Handle event selection
                        const urlParams = new URLSearchParams(window.location.search);
                        const eventParam = urlParams.get('event');
                        
                        if (eventParam && config.gittogethers.upcoming.some(e => e.name === eventParam)) {
                            document.getElementById('2076383007').value = eventParam;
                            this.elements.eventName.textContent = eventParam;
        } else {
                            this.elements.eventSelection.style.display = 'block';
                            utils.populateGitTogetherChoices(this.elements.eventSelection, (selectedEvent) => {
                                document.getElementById('2076383007').value = selectedEvent;
                                this.elements.eventName.textContent = selectedEvent;
                            });
                        }

                        // Add form submit handler
                        this.elements.form.addEventListener('submit', (e) => {
                            e.preventDefault();
                            
                            // Validate event selection if needed
                            if (this.elements.eventSelection.style.display !== 'none') {
                                const selectedEvent = document.querySelector('input[name="selected_event"]:checked');
                                if (!selectedEvent) {
                                    const formGroup = document.querySelector('#event-selection .form-group');
                                    utils.showRadioError(formGroup, 'Please select an event');
                                    return;
                                }
                            }

                            // Submit form
                            $('#bootstrapForm').ajaxSubmit({
                                url: this.elements.form.action,
                                type: 'POST',
                                dataType: 'xml',
                                success: () => this.showThankYouMessage(),
                                error: () => this.showThankYouMessage()
        });
    });

                        return true;
                    } catch (error) {
                        console.error('Error:', error);
                        utils.showInputError(this.elements.usernameInput, 'Invalid GitHub username');
                        return false;
                    } finally {
                        this.setLoading(false);
                    }
                },

                initialize() {
                    // Check for event in URL and display if valid
                    const urlParams = new URLSearchParams(window.location.search);
                    const eventParam = urlParams.get('event');
                    if (eventParam && config.gittogethers.upcoming.some(e => e.name === eventParam)) {
                        this.elements.eventName.textContent = eventParam;
                    }

                    // Add event listeners
                    this.elements.usernameInput.addEventListener('input', () => {
                        this.elements.usernameInput.classList.remove('error');
                        this.elements.errorMessage.textContent = '';
                    });

                    this.elements.proceedButton.addEventListener('click', (e) => this.handleSubmit(e));
                    this.elements.usernameInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            this.handleSubmit(e);
                        }
                    });
                }
            };

            CheckinPage.initialize();
        } else {
            // Initialize index page
            // ... existing index.html specific code ...
        }
    };

    // Initialize the page
    initializePage();
});