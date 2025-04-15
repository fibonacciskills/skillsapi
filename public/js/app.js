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
    document.getElementById('competency-upload-form').addEventListener('submit', handleCompetencyUpload);

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
    try {
        const response = await fetch(`${API_BASE_URL}/definitions/${competencyId}`);
        if (!response.ok) throw new Error('Failed to fetch competency details');
        
        const competency = await response.json();
        currentCompetencyId = competencyId;

        const detailContent = document.getElementById('competency-detail-content');
        detailContent.innerHTML = `
            <div class="container mt-4">
                <nav aria-label="breadcrumb">
                    <ol class="breadcrumb">
                        <li class="breadcrumb-item"><a href="#" onclick="showCompetencyList()">Competencies</a></li>
                        <li class="breadcrumb-item active">${competency.title}</li>
                    </ol>
                </nav>
                
                <div class="row">
                    <div class="col-md-8">
                        <h2>${competency.title}</h2>
                        <p class="text-muted">${competency.description || 'No description available'}</p>
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-primary" onclick="showEditCompetencyModal('${competencyId}')">
                            Edit Competency
                        </button>
                        <button class="btn btn-danger" onclick="deleteCompetency('${competencyId}')">
                            Delete Competency
                        </button>
                    </div>
                </div>

                <div class="mt-4">
                    <ul class="nav nav-tabs" id="competencyTabs" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active" id="levels-tab" data-bs-toggle="tab" data-bs-target="#levels" type="button" role="tab">
                                Proficiency Levels
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="mappings-tab" data-bs-toggle="tab" data-bs-target="#mappings" type="button" role="tab">
                                Mappings
                            </button>
                        </li>
                    </ul>

                    <div class="tab-content" id="competencyTabContent">
                        <div class="tab-pane fade show active" id="levels" role="tabpanel">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h3>Proficiency Scales</h3>
                                <button class="btn btn-success" onclick="showAddCriterionModal('${competencyId}')">
                                    Add Proficiency Scale
                                </button>
                            </div>
                            
                            ${competency.criteria && competency.criteria.length > 0 ? `
                                <div class="accordion" id="criteriaAccordion">
                                    ${competency.criteria.map((criterion, index) => `
                                        <div class="accordion-item">
                                            <h2 class="accordion-header">
                                                <button class="accordion-button ${index === 0 ? '' : 'collapsed'}" type="button" data-bs-toggle="collapse" data-bs-target="#criterion${criterion.id}">
                                                    ${criterion.name}
                                                </button>
                                            </h2>
                                            <div id="criterion${criterion.id}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}" data-bs-parent="#criteriaAccordion">
                                                <div class="accordion-body">
                                                    <p class="mb-3">${criterion.description || 'No description available'}</p>
                                                    
                                                    <div class="d-flex justify-content-between align-items-center mb-3">
                                                        <h4>Proficiency Levels</h4>
                                                        <button class="btn btn-success btn-sm" onclick="showAddLevelModal('${criterion._id}')">
                                                            Add Level
                                                        </button>
                                                    </div>
                                                    
                                                    ${criterion.levels && criterion.levels.length > 0 ? `
                                                        <div class="table-responsive">
                                                            <table class="table table-bordered">
                                                                <thead>
                                                                    <tr>
                                                                        <th>Level</th>
                                                                        <th>Description</th>
                                                                        <th>Examples</th>
                                                                        <th>Actions</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    ${criterion.levels.map(level => `
                                                                        <tr>
                                                                            <td>${level.level}</td>
                                                                            <td>
                                                                                <div class="editable" data-field="description" data-level-id="${level._id}">
                                                                                    ${level.description}
                                                                                </div>
                                                                            </td>
                                                                            <td>
                                                                                <div class="editable" data-field="examples" data-level-id="${level._id}">
                                                                                    ${level.examples && level.examples.length > 0 ? `
                                                                                        <ul class="mb-0">
                                                                                            ${level.examples.map(example => `
                                                                                                <li>${example}</li>
                                                                                            `).join('')}
                                                                                        </ul>
                                                                                    ` : 'No examples available'}
                                                                                </div>
                                                                            </td>
                                                                            <td>
                                                                                <button class="btn btn-sm btn-primary me-1 save-level-btn" data-level-id="${level._id}" style="display: none;">
                                                                                    Save
                                                                                </button>
                                                                                <button class="btn btn-sm btn-danger" onclick="deleteLevel('${level._id}')">
                                                                                    Delete
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    `).join('')}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ` : '<p>No levels defined yet.</p>'}
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : '<p>No proficiency scales defined yet.</p>'}
                        </div>

                        <div class="tab-pane fade" id="mappings" role="tabpanel">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h3>Mappings</h3>
                                <button class="btn btn-success" onclick="showAddMappingModal('${competencyId}')">
                                    Add Mapping
                                </button>
                            </div>
                            
                            ${competency.resourceAssociations && competency.resourceAssociations.length > 0 ? `
                                <div class="table-responsive">
                                    <table class="table table-bordered">
                                        <thead>
                                            <tr>
                                                <th>Type</th>
                                                <th>Related Competency</th>
                                                <th>Description</th>
                                                <th>Weight</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${competency.resourceAssociations.map(assoc => `
                                                <tr>
                                                    <td>${assoc.associationType}</td>
                                                    <td>${assoc.source._id === competencyId ? assoc.destination.title : assoc.source.title}</td>
                                                    <td>${assoc.description || 'No description'}</td>
                                                    <td>${assoc.weight}</td>
                                                    <td>
                                                        <button class="btn btn-sm btn-danger" onclick="deleteMapping('${assoc._id}')">
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            ` : '<p>No mappings defined yet.</p>'}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Show the modal
        competencyModalInstance.show();
    } catch (error) {
        console.error('Error showing competency details:', error);
        alert('Failed to load competency details: ' + error.message);
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

// Handle competency upload to existing framework
async function handleCompetencyUpload(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData();
    const fileInput = document.getElementById('competency-file');
    const frameworkId = selectedFrameworkId;

    if (!frameworkId) {
        alert('Please select a framework first');
        return;
    }

    formData.append('csvFile', fileInput.files[0]);

    const uploadStatus = document.getElementById('upload-status');
    uploadStatus.classList.remove('d-none', 'alert-success', 'alert-danger');
    uploadStatus.innerHTML = 'Uploading and processing...';

    try {
        const response = await fetch(`${API_BASE_URL}/upload-competencies/${frameworkId}`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            uploadStatus.classList.add('alert-success');
            uploadStatus.innerHTML = `Successfully added ${result.processedCount} competencies to the framework.`;
            form.reset();
            // Refresh the competencies list
            selectFramework(frameworkId);
        } else {
            throw new Error(result.message || 'Upload failed');
        }
    } catch (error) {
        uploadStatus.classList.add('alert-danger');
        uploadStatus.innerHTML = `Error: ${error.message}`;
    }
}

// Level Management Functions
async function showAddCriterionModal(competencyId) {
    const modalHtml = `
        <div class="modal fade" id="addCriterionModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add Proficiency Scale</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="add-criterion-form">
                            <div class="mb-3">
                                <label for="criterion-name" class="form-label">Name</label>
                                <input type="text" class="form-control" id="criterion-name" required>
                            </div>
                            <div class="mb-3">
                                <label for="criterion-description" class="form-label">Description</label>
                                <textarea class="form-control" id="criterion-description" rows="3"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="save-criterion-btn">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add modal to document
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('addCriterionModal'));
    modal.show();

    // Handle save
    document.getElementById('save-criterion-btn').addEventListener('click', async () => {
        const name = document.getElementById('criterion-name').value;
        const description = document.getElementById('criterion-description').value;

        try {
            const response = await fetch(`${API_BASE_URL}/criteria`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    description,
                    competencyId
                })
            });

            if (!response.ok) throw new Error('Failed to create criterion');

            modal.hide();
            showCompetencyDetails(competencyId); // Refresh the view
        } catch (error) {
            console.error('Error creating criterion:', error);
            alert('Failed to create criterion: ' + error.message);
        }
    });

    // Clean up modal when hidden
    document.getElementById('addCriterionModal').addEventListener('hidden.bs.modal', function () {
        this.remove();
    });
}

async function showEditCompetencyModal(competencyId) {
    try {
        const response = await fetch(`${API_BASE_URL}/definitions/${competencyId}`);
        if (!response.ok) throw new Error('Failed to fetch competency details');
        
        const competency = await response.json();

        const modalHtml = `
            <div class="modal fade" id="editCompetencyModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Edit Competency</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="edit-competency-form">
                                <div class="mb-3">
                                    <label for="edit-competency-title" class="form-label">Title</label>
                                    <input type="text" class="form-control" id="edit-competency-title" value="${competency.title}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-competency-description" class="form-label">Description</label>
                                    <textarea class="form-control" id="edit-competency-description" rows="3">${competency.description || ''}</textarea>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-competency-category" class="form-label">Category</label>
                                    <input type="text" class="form-control" id="edit-competency-category" value="${competency.category || ''}">
                                </div>
                                <div class="mb-3">
                                    <label for="edit-competency-group" class="form-label">Group</label>
                                    <input type="text" class="form-control" id="edit-competency-group" value="${competency.competencyGroup || ''}">
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="update-competency-btn">Update</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to document
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('editCompetencyModal'));
        modal.show();

        // Handle update
        document.getElementById('update-competency-btn').addEventListener('click', async () => {
            const updatedCompetency = {
                title: document.getElementById('edit-competency-title').value,
                description: document.getElementById('edit-competency-description').value,
                category: document.getElementById('edit-competency-category').value,
                competencyGroup: document.getElementById('edit-competency-group').value
            };

            try {
                const response = await fetch(`${API_BASE_URL}/definitions/${competencyId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedCompetency)
                });

                if (!response.ok) throw new Error('Failed to update competency');

                modal.hide();
                showCompetencyDetails(competencyId); // Refresh the view
            } catch (error) {
                console.error('Error updating competency:', error);
                alert('Failed to update competency: ' + error.message);
            }
        });

        // Clean up modal when hidden
        document.getElementById('editCompetencyModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });

    } catch (error) {
        console.error('Error showing edit modal:', error);
        alert('Failed to load competency details: ' + error.message);
    }
}

async function showAddLevelModal(criterionId) {
    if (!criterionId) {
        console.error('No criterion ID provided');
        return;
    }

    console.log('Adding level for criterion:', criterionId); // Debug log

    const modalHtml = `
        <div class="modal fade" id="addLevelModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add Proficiency Level</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="add-level-form">
                            <div class="mb-3">
                                <label for="level-number" class="form-label">Level Number</label>
                                <input type="number" class="form-control" id="level-number" min="1" max="10" required>
                            </div>
                            <div class="mb-3">
                                <label for="level-description" class="form-label">Description</label>
                                <textarea class="form-control" id="level-description" rows="3" required></textarea>
                            </div>
                            <div class="mb-3">
                                <label for="level-examples" class="form-label">Examples (one per line)</label>
                                <textarea class="form-control" id="level-examples" rows="3"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="save-level-btn">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add modal to document
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('addLevelModal'));
    modal.show();

    // Handle save
    document.getElementById('save-level-btn').addEventListener('click', async () => {
        const level = document.getElementById('level-number').value;
        const description = document.getElementById('level-description').value;
        const examples = document.getElementById('level-examples').value
            .split('\n')
            .filter(example => example.trim());

        try {
            console.log('Sending request to:', `${API_BASE_URL}/api/levels`); // Debug log
            const response = await fetch(`${API_BASE_URL}/api/levels`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    level: parseInt(level),
                    description,
                    examples,
                    criterion: criterionId
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create level');
            }

            modal.hide();
            showCompetencyDetails(currentCompetencyId); // Refresh the view
        } catch (error) {
            console.error('Error creating level:', error);
            alert('Failed to create level: ' + error.message);
        }
    });

    // Clean up modal when hidden
    document.getElementById('addLevelModal').addEventListener('hidden.bs.modal', function () {
        this.remove();
    });
}

// Add event listeners for in-place editing
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('editable')) {
        const element = e.target;
        const currentValue = element.textContent.trim();
        const field = element.dataset.field;
        const levelId = element.dataset.levelId;
        
        // Create input based on field type
        let input;
        if (field === 'examples') {
            input = document.createElement('textarea');
            input.value = currentValue;
            input.rows = 3;
        } else {
            input = document.createElement('input');
            input.type = 'text';
            input.value = currentValue;
        }
        
        // Replace content with input
        element.innerHTML = '';
        element.appendChild(input);
        input.focus();
        
        // Show save button
        const saveBtn = element.closest('tr').querySelector('.save-level-btn');
        saveBtn.style.display = 'inline-block';
        
        // Handle input blur
        input.addEventListener('blur', async function() {
            const newValue = input.value.trim();
            const saveBtn = element.closest('tr').querySelector('.save-level-btn');
            const row = element.closest('tr');
            const descriptionElement = row.querySelector('[data-field="description"]');
            const examplesElement = row.querySelector('[data-field="examples"]');
            
            // Get current values
            let description, examples;
            
            // If we're editing the description field
            if (field === 'description') {
                description = newValue;
                // Get examples from either input or display
                const examplesInput = examplesElement.querySelector('textarea');
                if (examplesInput) {
                    examples = examplesInput.value.split('\n').filter(line => line.trim());
                } else {
                    examples = examplesElement.textContent.trim() === 'No examples available' ? 
                        [] : 
                        Array.from(examplesElement.querySelectorAll('li')).map(li => li.textContent.trim());
                }
            } 
            // If we're editing the examples field
            else if (field === 'examples') {
                // Get description from either input or display
                const descriptionInput = descriptionElement.querySelector('input');
                description = descriptionInput ? descriptionInput.value.trim() : descriptionElement.textContent.trim();
                examples = newValue.split('\n').filter(line => line.trim());
            }
            // If we're editing any other field
            else {
                // Get description from either input or display
                const descriptionInput = descriptionElement.querySelector('input');
                description = descriptionInput ? descriptionInput.value.trim() : descriptionElement.textContent.trim();
                // Get examples from either input or display
                const examplesInput = examplesElement.querySelector('textarea');
                if (examplesInput) {
                    examples = examplesInput.value.split('\n').filter(line => line.trim());
                } else {
                    examples = examplesElement.textContent.trim() === 'No examples available' ? 
                        [] : 
                        Array.from(examplesElement.querySelectorAll('li')).map(li => li.textContent.trim());
                }
            }
            
            try {
                const response = await fetch(`${API_BASE_URL}/levels/${levelId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        description: description,
                        examples: examples
                    })
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to update level');
                }
                
                const updatedLevel = await response.json();
                
                // Update display
                if (field === 'examples') {
                    const examples = updatedLevel.examples || [];
                    element.innerHTML = examples.length > 0 ? 
                        `<ul class="mb-0">${examples.map(ex => `<li>${ex}</li>`).join('')}</ul>` : 
                        'No examples available';
                } else {
                    element.textContent = updatedLevel[field] || newValue;
                }
                
                // Hide save button
                saveBtn.style.display = 'none';
            } catch (error) {
                console.error('Error updating level:', error);
                alert('Failed to update level: ' + error.message);
                // Restore original content
                element.textContent = currentValue;
                saveBtn.style.display = 'none';
            }
        });
    }
});

// Add event listener for save buttons
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('save-level-btn')) {
        const levelId = e.target.dataset.levelId;
        const row = e.target.closest('tr');
        const description = row.querySelector('[data-field="description"]').textContent.trim();
        const examples = row.querySelector('[data-field="examples"]').textContent.trim();
        
        // Trigger blur event on any active input
        const activeInput = document.activeElement;
        if (activeInput && activeInput.tagName === 'INPUT' || activeInput.tagName === 'TEXTAREA') {
            activeInput.blur();
        }

        // Send update request
        fetch(`${API_BASE_URL}/levels/${levelId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                description: description,
                examples: examples.split('\n').filter(line => line.trim())
            })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.message || 'Failed to update level');
                });
            }
            return response.json();
        })
        .then(updatedLevel => {
            // Update display
            const descriptionCell = row.querySelector('[data-field="description"]');
            const examplesCell = row.querySelector('[data-field="examples"]');
            
            descriptionCell.textContent = updatedLevel.description;
            
            const examples = updatedLevel.examples || [];
            examplesCell.innerHTML = examples.length > 0 ? 
                `<ul class="mb-0">${examples.map(ex => `<li>${ex}</li>`).join('')}</ul>` : 
                'No examples available';
            
            // Hide save button
            e.target.style.display = 'none';
        })
        .catch(error => {
            console.error('Error updating level:', error);
            alert('Failed to update level: ' + error.message);
        });
    }
});

async function deleteLevel(levelId) {
    if (!levelId) {
        console.error('No level ID provided');
        return;
    }

    if (!confirm('Are you sure you want to delete this level?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/levels/${levelId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete level');

        showCompetencyDetails(currentCompetencyId); // Refresh the view
    } catch (error) {
        console.error('Error deleting level:', error);
        alert('Failed to delete level: ' + error.message);
    }
}

async function showAddMappingModal(competencyId) {
    try {
        // Get all frameworks
        const frameworkResponse = await fetch(`${API_BASE_URL}/frameworks`);
        if (!frameworkResponse.ok) throw new Error('Failed to fetch frameworks');
        const frameworks = await frameworkResponse.json();

        const modalHtml = `
            <div class="modal fade" id="addMappingModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Add Mapping (Related To)</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="add-mapping-form">
                                <div class="mb-3">
                                    <label for="target-framework" class="form-label">Target Framework</label>
                                    <select class="form-select" id="target-framework" required>
                                        <option value="" selected disabled>Select a framework...</option>
                                        ${frameworks.map(f => `<option value="${f._id}">${f.name}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="target-competency" class="form-label">Target Competency</label>
                                    <select class="form-select" id="target-competency" required disabled>
                                        <option value="" selected disabled>Select framework first...</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="mapping-description" class="form-label">Description (Optional)</label>
                                    <textarea class="form-control" id="mapping-description" rows="2"></textarea>
                                </div>
                                <div class="mb-3">
                                    <label for="mapping-weight" class="form-label">Weight</label>
                                    <input type="number" class="form-control" id="mapping-weight" min="0" max="10" value="1">
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="save-mapping-btn">Save Mapping</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to document
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modalElement = document.getElementById('addMappingModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();

        const targetFrameworkSelect = document.getElementById('target-framework');
        const targetCompetencySelect = document.getElementById('target-competency');

        // Event listener for framework selection
        targetFrameworkSelect.addEventListener('change', async (event) => {
            const selectedFrameworkId = event.target.value;
            targetCompetencySelect.innerHTML = '<option value="" selected disabled>Loading...</option>'; // Show loading state
            targetCompetencySelect.disabled = true;

            if (!selectedFrameworkId) return;

            try {
                const competencyResponse = await fetch(`${API_BASE_URL}/frameworks/${selectedFrameworkId}/definitions`);
                if (!competencyResponse.ok) throw new Error('Failed to fetch competencies for selected framework');
                const competencies = await competencyResponse.json();
                const filteredCompetencies = competencies.filter(c => c._id !== competencyId); // Exclude current competency

                targetCompetencySelect.innerHTML = '<option value="" selected disabled>Select a competency...</option>';
                if (filteredCompetencies.length === 0) {
                    targetCompetencySelect.innerHTML = '<option value="" selected disabled>No other competencies in this framework</option>';
                } else {
                    filteredCompetencies.forEach(c => {
                        targetCompetencySelect.innerHTML += `<option value="${c._id}">${c.title}</option>`;
                    });
                    targetCompetencySelect.disabled = false;
                }
            } catch (error) {
                console.error('Error fetching competencies:', error);
                targetCompetencySelect.innerHTML = '<option value="" selected disabled>Error loading competencies</option>';
                alert('Error loading competencies: ' + error.message);
            }
        });

        // Handle save
        document.getElementById('save-mapping-btn').addEventListener('click', async () => {
            const targetFrameworkId = targetFrameworkSelect.value;
            const targetCompetencyId = targetCompetencySelect.value;
            const description = document.getElementById('mapping-description').value;
            const weight = parseInt(document.getElementById('mapping-weight').value);

            if (!targetFrameworkId || !targetCompetencyId) {
                alert('Please select both a target framework and a target competency.');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/associations`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        source: competencyId, // Current competency is the source
                        destination: targetCompetencyId, // Selected competency is the destination
                        description,
                        weight,
                        associationType: 'RelatedTo', // Use the new type
                        framework: targetFrameworkId // Include framework ID
                    })
                });

                if (!response.ok) {
                     const errorData = await response.json();
                     throw new Error(errorData.message || 'Failed to create mapping');
                }

                modal.hide();
                showCompetencyDetails(competencyId); // Refresh the view
            } catch (error) {
                console.error('Error creating mapping:', error);
                alert('Failed to create mapping: ' + error.message);
            }
        });

        // Clean up modal when hidden
        modalElement.addEventListener('hidden.bs.modal', function () {
            this.remove();
        });

    } catch (error) {
        console.error('Error showing add mapping modal:', error);
        alert('Failed to load mapping form: ' + error.message);
    }
}

async function deleteMapping(associationId) {
    if (!confirm('Are you sure you want to delete this mapping?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/associations/${associationId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete mapping');

        showCompetencyDetails(currentCompetencyId); // Refresh the view
    } catch (error) {
        console.error('Error deleting mapping:', error);
        alert('Failed to delete mapping: ' + error.message);
    }
} 