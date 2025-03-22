// Implements rate limiting for API calls to avoid hitting rate limits
// Ensures minimum 1 second gap between consecutive calls
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

// Load configuration from YAML file
// Contains UI messages, button configurations and background image URLs
const loadConfig = async () => {
    try {
        const response = await fetch('data/config.yml');
        const yamlText = await response.text();
        return jsyaml.load(yamlText);
    } catch (error) {
        console.error('Error loading config:', error);
        return null;
    }
};

// Load and process events from JSON file
// Adds calculated fields like end_time and confirmation_time
// Returns array of event objects with name, times and original event data
const loadEvents = async () => {
    try {
        const response = await fetch('data/events.json');
        const events = await response.json();
        
        // Process events to add end_time and confirmation_time
        return events.map(event => {
            const eventDate = new Date(event.dateTime);
            const eventName = `${event.title.replace('GitTogether ', '')} (${eventDate.getDate() + getSuffix(eventDate.getDate())} ${getMonthName(eventDate.getMonth())} ${eventDate.getFullYear()})`;
            
            // Calculate end_time: 5 PM IST 2 days before the event day
            const endTime = new Date(eventDate);
            endTime.setDate(eventDate.getDate() - 2);
            endTime.setHours(17, 0, 0, 0); // 5:00 PM
            
            // Calculate confirmation_time: 11:59 PM IST 2 days before the event
            const confirmationTime = new Date(eventDate);
            confirmationTime.setDate(eventDate.getDate() - 2);
            confirmationTime.setHours(23, 59, 0, 0); // 11:59 PM
            
            return {
                name: eventName,
                end_time: endTime.toISOString(),
                confirmation_time: confirmationTime.toISOString(),
                originalEvent: event
            };
        });
    } catch (error) {
        console.error('Error loading events:', error);
        return [];
    }
};

// Helper functions for event date formatting
const getSuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
};

const getMonthName = (month) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month];
};

// Creates animated background mosaic from config-defined images
// Uses localStorage to cache image data for better performance
const createMosaicBackground = async (config) => {
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
};

// Validates GitHub username format and existence via GitHub API
// Returns user data if valid, throws error otherwise
const validateGitHubUsername = async (username) => {
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
};

// Display error state for input fields with error message
// Auto-resets after animation completes
const showInputError = (input, message) => {
    const originalPlaceholder = input.placeholder;
    
    input.classList.add('error');
    input.value = '';
    input.placeholder = message;
    
    // Reset the input state after animation
    setTimeout(() => {
        input.classList.remove('error');
        input.placeholder = originalPlaceholder;
    }, 2000);
};

// Display error state for radio button groups
// Auto-scrolls to error on mobile devices
const showRadioError = (container, message) => {
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
};

// Toggle button loading state with visual feedback
const setLoading = (button, isLoading) => {
    if (isLoading) {
        button.textContent = 'Pushing to production..';
        button.style.opacity = '0.7';
        button.disabled = true;
    } else {
        button.textContent = 'Proceed';
        button.style.opacity = '1';
        button.disabled = false;
    }
};

// Export utility functions for use in other modules
export {
    rateLimiter,
    loadConfig,
    loadEvents,
    createMosaicBackground,
    validateGitHubUsername, 
    showInputError,
    showRadioError,
    setLoading
};