       // All your apps with complete information
        const apps = [];

        // Function to load all apps
        function loadApps() {
            const appsContainer = document.getElementById('appsContainer');
            const modalContainer = document.getElementById('modalContainer');
            
            let notFoundMessage = document.getElementById('notFoundMessage');
            if (!notFoundMessage) {
                notFoundMessage = document.createElement('div');
                notFoundMessage.id = 'notFoundMessage';
                notFoundMessage.className = 'not-found-message';
                notFoundMessage.textContent = 'No apps found.';
                notFoundMessage.style.display = 'none';
                appsContainer.parentNode.insertBefore(notFoundMessage, appsContainer.nextSibling);
            }
            
            appsContainer.innerHTML = '';
            modalContainer.innerHTML = '';
            
            apps.forEach(app => {
                // Create app card
                const card = document.createElement('div');
                card.className = 'app-card';
                
                // Only add screenshot if it exists
                const screenshotContent = app.screenshot ? `
                    <div class="app-screenshot">
                        <div class="iphone-frame">
                            <div class="screen-content">
                                <img src="${app.screenshot}" alt="${app.title} Screenshot" loading="lazy">
                            </div>
                        </div>
                    </div>
                ` : '<div class="app-screenshot"></div>';
                
                card.innerHTML = `
                    <div class="app-icon">
                        <img src="${app.icon}" alt="${app.title} Icon" onerror="this.src='https://via.placeholder.com/100/007aff/ffffff?text=App'" loading="lazy">
                    </div>
                    <h3 class="app-title">${app.title}</h3>
                    <p class="app-developer">${app.developer}</p>
                    ${screenshotContent}
                    <button class="app-button" data-app-id="${app.id}">View Details</button>
                `;
                appsContainer.appendChild(card);
                
                // Create modal
                const modal = document.createElement('div');
                modal.className = 'modal-overlay';
                modal.id = `${app.id}Modal`;
                
                // Create version list items
                const versionItems = [];
                
                // Add archived versions
                if (app.versions.archived.length > 0) {
                    versionItems.push(...app.versions.archived.map(v => `<li>${v}</li>`));
                }
                
                // Add unarchived versions with red label if they exist
                if (app.versions.unarchived.length > 0) {
                    versionItems.push(`<li class="unarchived-label">Unarchived Versions</li>`);
                    versionItems.push(...app.versions.unarchived.map(v => `<li>${v}</li>`));
                }
                
                // Add download button if URL exists
                const downloadButton = app.downloadUrl ? `
                    <a href="${app.downloadUrl}" download class="download-button">
                        <i class="fas fa-download"></i> Download IPA
                    </a>
                ` : '';
                
                modal.innerHTML = `
                    <div class="modal-content">
                        <button class="close-modal">&times;</button>
                        <div class="modal-header">
                            <div class="modal-icon">
                                <img src="${app.icon}" alt="${app.title} Icon" onerror="this.src='https://via.placeholder.com/100/007aff/ffffff?text=App'" loading="lazy">
                            </div>
                            <div>
                                <h2 class="modal-title">${app.title}</h2>
                                <p class="modal-developer">${app.developer}</p>
                            </div>
                        </div>
                        
                        <div class="modal-section">
                            <h3><i class="fas fa-mobile-alt"></i> Compatibility</h3>
                            <p class="compatibility-text">${app.compatibility}</p>
                        </div>
                        
                        <div class="modal-section">
                            <h3><i class="fas fa-align-left"></i> App Description</h3>
                            ${app.description.split('\n').map(p => `<p>${p}</p>`).join('')}
                        </div>
                        
                        <div class="modal-section">
                            <h3><i class="fas fa-code-branch"></i> Version History</h3>
                            <div class="versions-container">
                                <div class="version-list">
                                    <ul>
                                        ${versionItems.join('')}
                                    </ul>
                                    ${downloadButton}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                modalContainer.appendChild(modal);
                
                // Add click handler
                card.querySelector(`[data-app-id="${app.id}"]`).addEventListener('click', function() {
                    const params = new URLSearchParams(window.location.search);
                    params.set('app', app.id);
                    const newUrl = window.location.pathname + '?' + params.toString();
                    window.history.replaceState({}, '', newUrl);
                    document.getElementById(`${app.id}Modal`).classList.add('active');
                    document.body.style.overflow = 'hidden';
                });
            });
            
            // Add modal close handlers
            document.querySelectorAll('.close-modal').forEach(btn => {
                btn.addEventListener('click', function() {
                    this.closest('.modal-overlay').classList.remove('active');
                    document.body.style.overflow = 'auto';
                    const params = new URLSearchParams(window.location.search);
                    params.delete('app');
                    const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
                    window.history.replaceState({}, '', newUrl);
                });
            });
            
            // Close modal when clicking outside
            document.querySelectorAll('.modal-overlay').forEach(modal => {
                modal.addEventListener('click', function(e) {
                    if (e.target === this) {
                        this.classList.remove('active');
                        document.body.style.overflow = 'auto';
                        const params = new URLSearchParams(window.location.search);
                        params.delete('app');
                        const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
                        window.history.replaceState({}, '', newUrl);
                    }
                });
            });
            
            // Close modal with Escape key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    document.querySelectorAll('.modal-overlay.active').forEach(modal => {
                        modal.classList.remove('active');
                        document.body.style.overflow = 'auto';
                    });
                }
            });
            
            // Search functionality
            const searchInput = document.getElementById('searchInput');
            const searchCancel = document.getElementById('searchCancel');

            const urlParams = new URLSearchParams(window.location.search);
            const initialQuery = urlParams.get('query');
            if (initialQuery) {
                searchInput.value = initialQuery;
                const event = new Event('input', { bubbles: true });
                searchInput.dispatchEvent(event);
            }

            searchInput.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                const params = new URLSearchParams(window.location.search);
                if (searchTerm.length > 0) {
                    params.set('query', searchTerm);
                } else {
                    params.delete('query');
                }
                const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
                window.history.replaceState({}, '', newUrl);
                const appCards = document.querySelectorAll('.app-card');
                let anyVisible = false;
                
                // Show/hide cancel button based on input
                if (searchTerm.length > 0) {
                    searchCancel.classList.add('visible');
                } else {
                    searchCancel.classList.remove('visible');
                }
                
                // Filter apps
                appCards.forEach(card => {
                    const title = card.querySelector('.app-title').textContent.toLowerCase();
                    if (title.includes(searchTerm)) {
                        card.style.display = 'flex';
                        anyVisible = true;
                    } else {
                        card.style.display = 'none';
                    }
                });
                if (!anyVisible) {
                    notFoundMessage.style.display = 'block';
                } else {
                    notFoundMessage.style.display = 'none';
                }
            });
            
            // Cancel search
            searchCancel.addEventListener('click', function() {
                searchInput.value = '';
                this.classList.remove('visible');
                document.querySelectorAll('.app-card').forEach(card => {
                    card.style.display = 'flex';
                });
                notFoundMessage.style.display = 'none';
                searchInput.blur();
                window.history.replaceState({}, '', window.location.pathname);
            });
            
            // Clicking outside search cancels it
            document.addEventListener('click', function(e) {
                if (!e.target.closest('.search-wrapper') && searchInput.value.length > 0) {
                    searchInput.blur();
                }
            });

            const appParam = urlParams.get('app');
            if (appParam) {
                const modal = document.getElementById(`${appParam}Modal`);
                if (modal) {
                    modal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                } else {
                    urlParams.delete('app');
                    const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
                    window.history.replaceState({}, '', newUrl);
                    setTimeout(() => {
                        alert('App ID not found, please try again later.');
                    }, 100);
                }
            }

            const queryParam = urlParams.get('query');
            if (queryParam) {
                searchInput.value = queryParam;
                const event = new Event('input', { bubbles: true });
                searchInput.dispatchEvent(event);
            }
        }

        // Load apps when page is ready
        document.addEventListener('DOMContentLoaded', loadApps);
