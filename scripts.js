document.addEventListener('DOMContentLoaded', () => {
    // Create mosaic background
    const createMosaicBackground = async () => {
        try {
            // Fetch the YAML file
            const response = await fetch('images.yml');
            const yamlText = await response.text();
            
            // Parse YAML (using jsyaml library)
            const imageData = jsyaml.load(yamlText);
            const images = imageData.background_images;

            // Shuffle the images array
            const shuffledImages = [...images].sort(() => Math.random() - 0.5);

            const mosaicContainer = document.createElement('div');
            mosaicContainer.className = 'background-mosaic';

            // Create 16 image elements (4x4 grid)
            for (let i = 0; i < 16; i++) {
                const img = document.createElement('img');
                img.src = shuffledImages[i % shuffledImages.length];
                img.className = 'mosaic-image';
                img.alt = '';
                mosaicContainer.appendChild(img);
            }

            document.body.insertBefore(mosaicContainer, document.body.firstChild);
        } catch (error) {
            console.error('Error loading background images:', error);
        }
    };

    createMosaicBackground();

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
        const response = await fetch(`https://api.github.com/users/${username}`);
        if (!response.ok) {
            throw new Error('Invalid username');
        }
        return await response.json();
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
            // First validate the username exists
            const response = await fetch(`https://api.github.com/users/${username}`);
            if (!response.ok) {
                errorMessage.textContent = 'Uh oh! Please enter a valid username.';
                return;
            }

            // Only set loading state after confirming username is valid
            setLoading(true);

            // If username is valid, get all the required data
            const userData = await response.json();
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