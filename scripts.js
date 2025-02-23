document.addEventListener('DOMContentLoaded', () => {
    // Rate limiting implementation
    const rateLimiter = {
        lastCall: 0,
        minInterval: 1000, // 1 second between calls
        async throttle(fn) {
            const now = Date.now();
            if (now - this.lastCall < this.minInterval) {
                await new Promise(resolve => setTimeout(resolve, this.minInterval));
            }
            this.lastCall = Date.now();
            return fn();
        }
    };

    let config = null;
    let userData = null;

    // Load config
    const loadConfig = async () => {
        try {
            const response = await fetch('config.yml');
            const yamlText = await response.text();
            config = jsyaml.load(yamlText);
            return config;
        } catch (error) {
            console.error('Error loading config:', error);
            return null;
        }
    };

    // Create mosaic background
    const createMosaicBackground = async () => {
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

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validateLinkedInUrl = (url) => {
        return url === '' || /^https:\/\/(www\.)?linkedin\.com\/.*$/.test(url);
    };

    const populateGitTogetherChoices = () => {
        const fieldset = document.querySelector('legend[for="1521228078"]').parentElement;
        const formGroup = fieldset.querySelector('.form-group');
        const helpBlock = formGroup.querySelector('.help-block');
        
        // Update description
        helpBlock.textContent = config.gittogethers.description;

        // Clear existing radio buttons
        const radioContainer = formGroup.querySelector('.radio').parentElement;
        radioContainer.innerHTML = '';

        // Add new radio buttons
        config.gittogethers.upcoming.forEach(event => {
            const div = document.createElement('div');
            div.className = 'radio';
            div.innerHTML = `
                <label>
                    <input type="radio" name="entry.1334197574" value="${event.value}" required>
                    ${event.name}
                </label>
            `;
            radioContainer.appendChild(div);
        });
    };

    const showSection = (section) => {
        section1.style.display = 'none';
        section2.style.display = 'none';
        section3.style.display = 'none';
        section.style.display = 'block';
    };

    const validateSection1 = () => {
        const requiredFields = [
            'entry.1334197574',  // GitTogether choice
            'entry.1294570093',  // Email
            'entry.1547278427',  // City
            'entry.2043018353',  // Country
            'entry.2134794723',  // Current Role
            'entry.1174706497'   // Company/Organisation
        ];

        const emailInput = document.getElementById('1294570093');
        if (!validateEmail(emailInput.value)) {
            alert('Please enter a valid email address');
            return false;
        }

        for (const field of requiredFields) {
            const input = document.querySelector(`[name="${field}"]`);
            if (input.type === 'radio') {
                const radioGroup = document.querySelectorAll(`[name="${field}"]`);
                const checked = Array.from(radioGroup).some(radio => radio.checked);
                if (!checked) {
                    alert('Please fill in all required fields');
                    return false;
                }
                // Check if "other" is selected and the text field is empty
                const otherRadio = document.querySelector(`[name="${field}"][value="__other_option__"]`);
                if (otherRadio?.checked) {
                    const otherInput = document.querySelector(`[name="${field}.other_option_response"]`);
                    if (!otherInput.value.trim()) {
                        alert('Please specify the other option');
                        return false;
                    }
                }
            } else if (!input.value.trim()) {
                alert('Please fill in all required fields');
                return false;
            }
        }
        return true;
    };

    const validateSection2 = () => {
        const requiredFields = [
            'entry.220097591',   // Role/Designation
            'entry.2114391014',  // Years of experience
        ];

        for (const field of requiredFields) {
            const input = document.querySelector(`[name="${field}"]`);
            if (input.type === 'radio') {
                const radioGroup = document.querySelectorAll(`[name="${field}"]`);
                const checked = Array.from(radioGroup).some(radio => radio.checked);
                if (!checked) {
                    alert('Please fill in all required fields');
                    return false;
                }
            } else if (!input.value.trim()) {
                alert('Please fill in all required fields');
                return false;
            }
        }

        const linkedInInput = document.getElementById('1623578350');
        if (linkedInInput.value && !validateLinkedInUrl(linkedInInput.value)) {
            alert('Please enter a valid LinkedIn profile URL');
            return false;
        }

        return true;
    };

    const validateSection3 = () => {
        const motivationField = document.getElementById('2085773688');
        if (!motivationField.value.trim()) {
            alert('Please fill in your motivation for attending');
            return false;
        }
        return true;
    };

    const updateRoleDesignationLegend = () => {
        const companyInput = document.getElementById('1174706497');
        const companyName = companyInput.value.trim();
        const roleDesignationLegend = document.querySelector('legend[for="1835765444"]');
        roleDesignationLegend.textContent = companyName ? `Role/Designation at ${companyName}` : 'Role/Designation';
    };

    const handleSubmit = async (event) => {
        event?.preventDefault();
        
        const username = usernameInput.value.trim();
        errorMessage.textContent = '';
        
        if (!username) {
            errorMessage.textContent = 'Uh oh! Please enter a valid username.';
            return;
        }

        try {
            userData = await validateGitHubUsername(username);
            setLoading(true);

            // Update UI
            logoImage.src = userData.avatar_url;
            heading.textContent = `Hello ${userData.name || userData.login} 👋`;
            headerContent.classList.add('compact');

            // Hide username input and proceed button
            usernameInput.parentElement.style.display = 'none';
            proceedButton.style.display = 'none';

            // Set the GitHub Username and Full Name
            document.getElementById('1252770814').value = userData.login || '';
            document.getElementById('1001119393').value = userData.name || userData.login || '';

            // Auto-fill email if available
            if (userData.email) {
                document.getElementById('1294570093').value = userData.email;
            }

            // Auto-fill company if available
            const companyInput = document.getElementById('1174706497');
            if (userData.company) {
                companyInput.value = userData.company;
                updateRoleDesignationLegend();
            }

            // Add event listener for company name changes
            companyInput.addEventListener('input', updateRoleDesignationLegend);

            setLoading(false);
            form.style.display = 'block';
            showSection(section1);

        } catch (error) {
            console.error('Error:', error);
            errorMessage.textContent = 'Uh oh! Please enter a valid username.';
            setLoading(false);
        }
    };

    const submitForm = () => {
        if (!validateSection3()) {
            return;
        }

        // Remove required attribute from LinkedIn field before submission
        const linkedInInput = document.getElementById('1623578350');
        linkedInInput.removeAttribute('required');

        // Use jQuery form plugin for submission
        $('#bootstrapForm').ajaxSubmit({
            url: form.action,
            type: 'POST',
            dataType: 'xml',  // Changed from jsonp to xml
            success: function(response) {
                // Show thank you message
                const content = document.querySelector('.content');
                content.innerHTML = `<div class="thank-you-message">${config.thank_you_message}</div>`;
            },
            error: function() {
                // Google Forms doesn't support CORS but form is still submitted
                // Show thank you message even on error
                const content = document.querySelector('.content');
                content.innerHTML = `<div class="thank-you-message">${config.thank_you_message}</div>`;
            }
        });
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

        const currentRole = document.querySelector('input[name="entry.2134794723"]:checked');
        if (currentRole && (currentRole.value === 'University Student' || currentRole.value === 'High School Student')) {
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

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        submitForm();
    });

    // Initialize
    (async () => {
        await loadConfig();
        createMosaicBackground();
        populateGitTogetherChoices();
    })();
});