// Global variables
const API_BASE_URL = '/api';
let selectedFrameworkId = null;
let competencyModalInstance = null;
let currentCompetencyId = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Bootstrap modal
    const competencyModal = document.getElementById('competencyModal');
    if (competencyModal) {
        competencyModalInstance = new bootstrap.Modal(competencyModal);
    }

    // Setup event listeners
    document.getElementById('show-json-btn').addEventListener('click', showCompetencyJSON);
    document.getElementById('show-case-json-btn').addEventListener('click', showCompetencyCASEJSON);
    document.getElementById('upload-form').addEventListener('submit', handleCSVUpload);

    // Load frameworks on page load
    loadFrameworks();
});

// Handle CSV file upload
async function handleCSVUpload(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData();
    const fileInput = document.getElementById('csv-file');
    const frameworkName = document.getElementById('framework-name').value;
    const frameworkDescription = document.getElementById('framework-description').value;
    const frameworkVersion = document.getElementById('framework-version').value;

    formData.append('csvFile', fileInput.files[0]);
    formData.append('frameworkName', frameworkName);
    formData.append('frameworkDescription', frameworkDescription);
    formData.append('frameworkVersion', frameworkVersion);

    const uploadStatus = document.getElementById('upload-status');
    uploadStatus.classList.remove('d-none', 'alert-success', 'alert-danger');
    uploadStatus.innerHTML = 'Uploading and processing...';

    try {
        const response = await fetch(`${API_BASE_URL}/upload-csv`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            uploadStatus.classList.add('alert-success');
            uploadStatus.innerHTML = `Framework created successfully! Processed ${result.processedCount} competencies.`;
            form.reset();
            loadFrameworks(); // Refresh the frameworks list
        } else {
            throw new Error(result.message || 'Upload failed');
        }
    } catch (error) {
        uploadStatus.classList.add('alert-danger');
        uploadStatus.innerHTML = `Error: ${error.message}`;
    }
}

// Load all frameworks
async function loadFrameworks() {
    const frameworksList = document.getElementById('frameworks-list');
    frameworksList.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';

    try {
        const response = await fetch(`${API_BASE_URL}/frameworks`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const frameworks = await response.json();
        
        if (frameworks.length === 0) {
            frameworksList.innerHTML = '<div class="alert alert-info">No frameworks found.</div>';
            return;
        }

        const frameworksHTML = frameworks.map(framework => `
            <div class="list-group-item list-group-item-action" data-framework-id="${framework._id}">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h5 class="mb-1">${framework.name}</h5>
                        <p class="mb-1">${framework.description || 'No description'}</p>
                        <small>Version: ${framework.version}</small>
                    </div>
                    <button class="btn btn-danger btn-sm delete-framework" data-framework-id="${framework._id}">Delete</button>
                </div>
            </div>
        `).join('');

        frameworksList.innerHTML = frameworksHTML;

        // Add click handlers for framework items
        document.querySelectorAll('.list-group-item[data-framework-id]').forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't trigger if clicking the delete button
                if (!e.target.closest('.delete-framework')) {
                    const frameworkId = item.dataset.frameworkId;
                    selectFramework(frameworkId);
                }
            });
        });

        // Add click handlers for delete buttons
        document.querySelectorAll('.delete-framework').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent framework selection
                const frameworkId = button.dataset.frameworkId;
                deleteFramework(frameworkId);
            });
        });

    } catch (error) {
        console.error('Error loading frameworks:', error);
        frameworksList.innerHTML = `<div class="alert alert-danger">Error loading frameworks: ${error.message}</div>`;
    }
}

// Select a framework and load its competencies
async function selectFramework(frameworkId) {
    selectedFrameworkId = frameworkId;
    
    // Update UI
    document.querySelectorAll('.list-group-item[data-framework-id]').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.frameworkId === frameworkId) {
            item.classList.add('active');
        }
    });

    // Show loading state
    document.getElementById('no-framework-selected').classList.add('d-none');
    document.getElementById('selected-framework-info').classList.remove('d-none');
    document.getElementById('competencies-list').innerHTML = `
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    `;

    try {
        // Get framework details
        const frameworkResponse = await fetch(`${API_BASE_URL}/frameworks/${frameworkId}`);
        if (!frameworkResponse.ok) throw new Error(`HTTP error! Status: ${frameworkResponse.status}`);
        
        const framework = await frameworkResponse.json();
        document.getElementById('selected-framework-name').textContent = 
            `${framework.name} (v${framework.version})`;

        // Get competencies
        const competenciesResponse = await fetch(`${API_BASE_URL}/frameworks/${frameworkId}/definitions`);
        if (!competenciesResponse.ok) throw new Error(`HTTP error! Status: ${competenciesResponse.status}`);
        
        const competencies = await competenciesResponse.json();
        
        if (competencies.length === 0) {
            document.getElementById('competencies-list').innerHTML = 
                '<div class="alert alert-info">No competencies found in this framework.</div>';
            return;
        }

        const competenciesHTML = competencies.map(competency => `
            <div class="list-group-item list-group-item-action" data-competency-id="${competency._id}">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h5 class="mb-1">${competency.title}</h5>
                        <p class="mb-1">${competency.description || 'No description'}</p>
                        <small>Group: ${competency.competencyGroup || 'N/A'} | Category: ${competency.category || 'N/A'}</small>
                    </div>
                </div>
            </div>
        `).join('');

        document.getElementById('competencies-list').innerHTML = competenciesHTML;

        // Add click handlers for competency items
        document.querySelectorAll('.list-group-item[data-competency-id]').forEach(item => {
            item.addEventListener('click', () => {
                const competencyId = item.dataset.competencyId;
                showCompetencyDetails(competencyId);
            });
        });

    } catch (error) {
        console.error('Error loading competencies:', error);
        document.getElementById('competencies-list').innerHTML = 
            `<div class="alert alert-danger">Error loading competencies: ${error.message}</div>`;
    }
}

// Show competency details in modal
async function showCompetencyDetails(competencyId) {
    currentCompetencyId = competencyId;
    const detailContent = document.getElementById('competency-detail-content');
    detailContent.innerHTML = `
        <div class="text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;

    competencyModalInstance.show();

    try {
        const response = await fetch(`${API_BASE_URL}/definitions/${competencyId}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const competency = await response.json();
        
        let levelsHTML = '';
        if (competency.criteria && competency.criteria.length > 0) {
            competency.criteria.forEach(criterion => {
                if (criterion.levels && criterion.levels.length > 0) {
                    levelsHTML += `
                        <div class="card mb-3">
                            <div class="card-header bg-light">
                                <strong>${criterion.name || 'Proficiency Levels'}</strong>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    ${criterion.levels.map(level => `
                                        <div class="col-md-12 mb-3">
                                            <div class="level-badge level-${level.level}">Level ${level.level}</div>
                                            <h6 class="mt-2">${level.name || `Level ${level.level}`}</h6>
                                            <p class="mb-2">${level.description || 'No description available'}</p>
                                            ${level.examples && level.examples.length > 0 ? `
                                                <div class="examples mt-2">
                                                    <strong>Examples:</strong>
                                                    <ul class="mb-0">
                                                        ${level.examples.map(example => `<li>${example}</li>`).join('')}
                                                    </ul>
                                                </div>
                                            ` : ''}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    `;
                }
            });
        } else {
            levelsHTML = '<div class="alert alert-info">No proficiency levels defined for this competency.</div>';
        }

        const detailHTML = `
            <div class="card mb-3">
                <div class="card-header bg-primary text-white">
                    <h5>${competency.title}</h5>
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <strong>Group:</strong> ${competency.competencyGroup || 'N/A'}
                        </div>
                        <div class="col-md-6">
                            <strong>Category:</strong> ${competency.category || 'N/A'}
                        </div>
                    </div>
                    <div class="mb-3">
                        <strong>Description:</strong>
                        <p>${competency.description || 'No description available'}</p>
                    </div>
                    ${levelsHTML}
                </div>
            </div>
        `;

        detailContent.innerHTML = detailHTML;
    } catch (error) {
        console.error('Error loading competency details:', error);
        detailContent.innerHTML = `
            <div class="alert alert-danger">
                Error loading competency details: ${error.message}
            </div>
        `;
    }
}

// Show JSON for current competency
function showCompetencyJSON() {
    if (currentCompetencyId) {
        window.open(`${API_BASE_URL}/definitions/${currentCompetencyId}`, '_blank');
    }
}

// Show CASE JSON for current competency
function showCompetencyCASEJSON() {
    if (currentCompetencyId) {
        window.open(`${API_BASE_URL}/case/CFItems/${currentCompetencyId}`, '_blank');
    }
}

// Delete a framework
async function deleteFramework(frameworkId) {
    if (!confirm('Are you sure you want to delete this framework? This will also delete all associated competencies and cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/frameworks/${frameworkId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // If this was the selected framework, clear the selection
        if (selectedFrameworkId === frameworkId) {
            selectedFrameworkId = null;
            document.getElementById('no-framework-selected').classList.remove('d-none');
            document.getElementById('selected-framework-info').classList.add('d-none');
        }

        // Reload the frameworks list
        loadFrameworks();

    } catch (error) {
        console.error('Error deleting framework:', error);
        alert(`Error deleting framework: ${error.message}`);
    }
} 