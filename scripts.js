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
                // Fetch the YAML file
                const response = await fetch('images.yml');
                const yamlText = await response.text();
                
                // Parse YAML
                const imageData = jsyaml.load(yamlText);
                images = imageData.background_images;
                
                // Cache the images
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

    // Start loading the background after a small delay to ensure initial color is visible
    setTimeout(createMosaicBackground, 100);

    const usernameInput = document.getElementById('github-username');
    const proceedButton = document.getElementById('proceed-button');
    const errorMessage = document.getElementById('error-message');

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

    const getUserOrganizations = async (username) => {
        try {
            const response = await fetch(`https://api.github.com/users/${username}/orgs`);
            if (!response.ok) {
                return '';
            }
            const orgs = await response.json();
            return orgs.map(org => org.login).join(',');
        } catch (error) {
            console.error('Error fetching organizations:', error);
            return '';
        }
    };

    const constructFormUrl = (userData, orgs) => {
        const baseUrl = 'https://docs.google.com/forms/d/e/1FAIpQLScb3J5YDjU3Pn-znAV0S9rrLA1OkWGWwtqD56FayN9ptsbE4w/viewform';
        const params = new URLSearchParams({
            'usp': 'pp_url',
            'entry.1252770814': userData.login || '',
            'entry.1001119393': userData.name || userData.login || ''
        });
        return `${baseUrl}?${params.toString()}`;
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
            // First validate the username
            const userData = await validateGitHubUsername(username);
            
            // Only set loading state after username is validated
            setLoading(true);
            
            const orgs = await getUserOrganizations(username);
            const formUrl = constructFormUrl(userData, orgs);
            window.location.href = formUrl;
        } catch (error) {
            console.error('Error:', error);
            errorMessage.textContent = 'Uh oh! Please enter a valid username.';
            setLoading(false);
        }
    };

    proceedButton.addEventListener('click', handleSubmit);
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
    });
});