/*Global Variables*/
const titles = {
    1: 'Step 1: Select Scenario',
    2: 'Step 2: Your Values',
    3: 'Step 3: Select Stakeholder', 
    4: 'Step 4: Stakeholder Values',
    5: 'Step 5: Compare & Reflect'
};
    
const subtitles = {
    1: 'Choose an AI scenario to explore',
    2: 'Select 3 values from your perspective',
    3: 'Choose a different stakeholder perspective',
    4: 'Select 3 values from stakeholder perspective',
    5: 'Review selections and reflect'
};


/* UTILITY FUNCTIONS */
const utils = {
  /* Debounces a function call */
  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  },

  /**
   * Validates if an element has non-empty text content
   */
  validateCustomText(elementId) {
    const element = document.getElementById(elementId);
    return element?.value?.trim().length > 0;
  },

  /**
   * Updates character count display and styling
   */
  updateCharacterCount(textarea, countElement, maxLength = 200) {
    //alert(countElement[0]);
    if (!countElement) return;
    const charCount = textarea.value.length;
    countElement[0].textContent = charCount;
    countElement[0].className = charCount > maxLength * 0.9 ? 'current-count warning' : 'current-count';
  },

  /**
   * Removes 'selected' class from all matching elements
   */
  clearAllSelections(selector) {
    document.querySelectorAll(selector).forEach(card => {
      card.classList.remove('selected');
    });
  },

  /**
   * Shows error message to user
   */
  showError(message) {
    console.error(message);
    alert(message);
    this.announceToScreenReader(message);
  },

  /**
   * Announces a message to screen readers using an ARIA live region
   */
  announceToScreenReader(message) {
    // Create or get the live region
    let liveRegion = document.getElementById('screen-reader-announcer');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'screen-reader-announcer';
      liveRegion.className = 'sr-only';
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', 'polite');
      document.body.appendChild(liveRegion);
    }

    // Update the content to trigger announcement
    liveRegion.textContent = '';
    setTimeout(() => {
      liveRegion.textContent = message;
    }, 100);
  },

  /**
   * Formats value text for display, handling custom values
   */
  formatValueForDisplay(value, mode) {
    // Standard value
    if (!value.startsWith('Other')) return value;

    // Original format: "Other (mode)"
    if (value.startsWith('Other (')) {
      const elementId = mode === 'user' ? 'custom-value-user' : 'custom-value-stakeholder';
      const customText = document.getElementById(elementId)?.value || '';
      return customText ? `Custom: ${customText}` : 'Custom';
    }
    
    // New format: "Other-{mode}-{number}"
    const [prefix, type, number] = value.split('-');
    if (type && number) {
      const elementId = `custom-value-${type}-${number}`;
      const customText = document.getElementById(elementId)?.value || '';
      return customText ? `Custom: ${customText}` : 'Custom';
    }
    
    return value;
  }
};

/* APPLICATION STATE */

/*Central application state management */
const AppState = {
    // Navigation state
    currentStep: 1,
    
    // Selection state
    userValues: [],
    stakeholderValues: [],
    selectedScenario: null,
    selectedStakeholder: null,
    selectedStakeholderName: null,

    /**
     * Resets application state to initial values
     */
    reset() {
        this.currentStep = 1;
        this.userValues = [];
        this.stakeholderValues = [];
        this.selectedScenario = null;
        this.selectedStakeholder = null;
        this.selectedStakeholderName = null;
    }
};

/**
 * Cached DOM element getters
 */
const OriginalElements = {
    // Input elements
    get customScenario() { 
        return document.getElementById('custom-scenario'); 
    },
    get customValueUser() { 
        return document.getElementById('custom-value-user'); 
    },
    get customValueStakeholder() { 
        return document.getElementById('custom-value-stakeholder'); 
    },
    get customStakeholder() { 
        return document.getElementById('custom-stakeholder'); 
    },

    // Character count elements
    get scenarioCharCount() { 
        return document.getElementById('custom-scenario-count').getElementsByClassName("current-count"); 
    },
    get valueCharCountUser() { 
        return document.getElementById('value-char-count-user').getElementsByClassName("current-count"); 
    },
    get valueCharCountStakeholder() { 
        return document.getElementById('value-char-count-stakeholder').getElementsByClassName("current-count"); 
    },
    get stakeholderCharCount() {
        return document.getElementById('stakeholder-char-count').getElementsByClassName("current-count"); 
    }
};

// Custom value card counters
let customValueCount = 1;
let customStakeholderValueCount = 1;

// Creates a new custom value card
function addCustomValueCard() {
    if (customValueCount >= 3) {
        utils.showError('Maximum of 3 custom value cards allowed');
        return;
    }

    customValueCount++;
    
    const newCard = document.createElement('div');
    newCard.className = 'value-card custom-value-card custom-user-value';
    newCard.setAttribute('role', 'button');
    newCard.setAttribute('tabindex', '0');
    newCard.setAttribute('aria-pressed', 'false');
    newCard.setAttribute('aria-label', `Add custom value ${customValueCount}`);
    
    newCard.onclick = function() { 
        selectValue(this, `Custom Value ${customValueCount}`, 'user'); 
    };
    /*
    newCard.onkeydown = function(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            selectValue(this, `Other-user-${customValueCount}`, 'user');
        }
    };
    */
    newCard.innerHTML = `
        <div class="value-card-header">
            <div class="value-card-icon"></div>
        </div>
        <h3 id="custom-value-user-label-${customValueCount}">Custom Value ${customValueCount}</h3>
        <label for="custom-value-user-${customValueCount}" class="sr-only">Enter custom value description</label>
        <textarea 
            id="custom-value-user-${customValueCount}" 
            placeholder="Describe another value (200 characters max)..."
            maxlength="200"
            oninput="updateCustomUserValue(this, ${customValueCount})"
            onclick="event.stopPropagation()"
            aria-required="true"
            aria-label="Custom value description"
            aria-describedby="custom-value-hint-${customValueCount}"
        ></textarea>
        <div class="character-count" id="value-char-count-user-${customValueCount}">
            <span class="current-count">0</span>/200
        </div>
        <div id="custom-value-hint-${customValueCount}" class="sr-only">
            Enter a description for your custom value. Maximum 200 characters.
        </div>
        <button class="delete-custom-card" onclick="deleteCustomValueCard(this, ${customValueCount})">×</button>
    `;

    const addButton = document.getElementById('add-value-button');
    addButton.parentNode.insertBefore(newCard, addButton);

    if (customValueCount >= 3) {
        addButton.style.display = 'none';
    }
}

// Updates custom value when textarea changes
function updateCustomUserValue(textarea, cardNumber) {
    const charCountElement = document.getElementById(`value-char-count-user-${cardNumber}`).getElementsByClassName('current-count');
    //alert(charCountElement);
    utils.updateCharacterCount(textarea, charCountElement);
    
    const customCard = textarea.closest('.value-card');
    const targetArray = AppState.userValues;
    const uniqueOtherId = `Other-user-${cardNumber}`;
    
    if (textarea.value.trim().length > 0) {
        if (!targetArray.includes(uniqueOtherId) && targetArray.length < 3) {
            targetArray.push(uniqueOtherId);
            customCard.classList.add('selected');
        }
    } else {
        const index = targetArray.indexOf(uniqueOtherId);
        if (index > -1) {
            targetArray.splice(index, 1);
        }
        customCard.classList.remove('selected');
    }
    
    updateCounter('user', targetArray.length);
    updateNavigation();
    if (AppState.currentStep === 5) updateComparison();
}

// Removes a custom value card
function deleteCustomValueCard(button, cardNumber) {
    const card = button.closest('.custom-value-card');
    const uniqueOtherId = `Other-user-${cardNumber}`;
    
    // Remove from state
    const index = AppState.userValues.indexOf(uniqueOtherId);
    if (index > -1) {
        AppState.userValues.splice(index, 1);
    }
    
    // Clear and remove card
    const textarea = card.querySelector('textarea');
    if (textarea) textarea.value = '';
    card.classList.remove('selected');
    card.remove();
    
    // Update UI state
    const remainingCustomCards = document.querySelectorAll('#step-2 .value-card.custom-value-card:not(#add-value-button)');
    customValueCount = remainingCustomCards.length;
    const addButton = document.getElementById('add-value-button');
    if (addButton) addButton.style.display = 'flex';
    
    updateCounter('user', AppState.userValues.length);
    updateNavigation();
    if (AppState.currentStep === 5) updateComparison();
}

// Creates a new custom stakeholder value card
function addCustomStakeholderValueCard() {
    if (customStakeholderValueCount >= 3) {
        utils.showError('Maximum of 3 custom value cards allowed');
        return;
    }

    customStakeholderValueCount++;
    
    const newCard = document.createElement('div');
    newCard.className = 'value-card custom-value-card custom-stakeholder-value';
    newCard.onclick = function() { 
        selectValue(this, `Custom Stakeholder ${customStakeholderValueCount}`, 'stakeholder'); 
    };
    
    newCard.innerHTML = `
        <div class="value-card-header">
            <div class="value-card-icon"></div>
        </div>
        <h3 id="custom-value-stakeholder-label-${customStakeholderValueCount}" >Custom Value ${customStakeholderValueCount}</h3>
        <label for="custom-value-stakeholder-${customStakeholderValueCount}" class="sr-only">Custom stakeholder value description</label>
        <textarea 
            id="custom-value-stakeholder-${customStakeholderValueCount}" 
            placeholder="Describe another stakeholder value (200 characters max)..."
            maxlength="200"
            oninput="updateCustomStakeholderValue(this, ${customStakeholderValueCount})"
            onclick="event.stopPropagation()"
            aria-required="true"
            aria-label="custom-value-stakeholder-${customStakeholderValueCount}"
            aria-describedby="custom-value-stakeholder-hint-${customStakeholderValueCount}"
        ></textarea>
        <div class="character-count" id="value-char-count-stakeholder-${customStakeholderValueCount}">
            <span class="current-count">0</span>/200
        </div>
        <div id="custom-value-stakeholder-hint-${customStakeholderValueCount}" class="sr-only">
            Enter a description for your custom value. Maximum 200 characters.
        </div>
        <button class="delete-custom-card" onclick="deleteCustomStakeholderValueCard(this, ${customStakeholderValueCount})">×</button>
    `;

    const addButton = document.getElementById('add-stakeholder-value-button');
    addButton.parentNode.insertBefore(newCard, addButton);

    if (customStakeholderValueCount >= 3) {
        addButton.style.display = 'none';
    }
}

// Updates custom stakeholder value when textarea changes
function updateCustomStakeholderValue(textarea, cardNumber) {
    const charCountElement = document.getElementById(`value-char-count-stakeholder-${cardNumber}`).getElementsByClassName('current-count');
    utils.updateCharacterCount(textarea, charCountElement);
    //alert(charCountElement);
    const customCard = textarea.closest('.value-card');
    const uniqueOtherId = `Other-stakeholder-${cardNumber}`;
    
    if (textarea.value.trim().length > 0) {
        if (!AppState.stakeholderValues.includes(uniqueOtherId) && AppState.stakeholderValues.length < 3) {
            AppState.stakeholderValues.push(uniqueOtherId);
            customCard.classList.add('selected');
        }
    } else {
        const index = AppState.stakeholderValues.indexOf(uniqueOtherId);
        if (index > -1) {
            AppState.stakeholderValues.splice(index, 1);
            customCard.classList.remove('selected');
        }
    }
    
    updateCounter('stakeholder', AppState.stakeholderValues.length);
    updateNavigation();
    if (AppState.currentStep === 5) updateComparison();
}

// Removes a custom stakeholder value card
function deleteCustomStakeholderValueCard(button, cardNumber) {
    const card = button.closest('.custom-value-card');
    const uniqueOtherId = `Other-stakeholder-${cardNumber}`;
    
    // Remove from state
    const index = AppState.stakeholderValues.indexOf(uniqueOtherId);
    if (index > -1) {
        AppState.stakeholderValues.splice(index, 1);
    }
    
    // Remove card
    card.remove();
    
    // Update UI state
    const remainingCustomCards = document.querySelectorAll('#desktop-step-4 .value-card.custom-value-card:not(#add-stakeholder-value-button)');
    customStakeholderValueCount = remainingCustomCards.length;
    const addButton = document.getElementById('add-stakeholder-value-button');
    if (addButton) addButton.style.display = 'flex';
    
    updateCounter('stakeholder', AppState.stakeholderValues.length);
    updateNavigation();
    if (AppState.currentStep === 5) updateComparison();
}

// Helper functions
function validateCustomText(elementId) {
    return utils.validateCustomText(elementId);
}

function updateCounter(mode, count) {
    const counterId = `${mode}-counter`;
    const counter = document.getElementById(counterId);
    if (!counter) return;
    
    // Set ARIA properties
    counter.setAttribute('role', 'status');
    counter.setAttribute('aria-live', 'polite');
    
    const message = `${count}/3 values selected`;
    counter.textContent = message;
    counter.className = count === 3 ? 
        'selection-counter complete' : 
        'selection-counter';
        
    // Announce selection status to screen readers
    if (count === 3) {
        utils.announceToScreenReader(`All three values selected for ${mode === 'user' ? 'yourself' : 'stakeholder'}`);
    } else {
        utils.announceToScreenReader(`${count} of 3 values selected for ${mode === 'user' ? 'yourself' : 'stakeholder'}`);
    }
}

function clearAllSelections(selector) {
    utils.clearAllSelections(selector);
}

// Sidebar controls
function toggleInstructions() {
    const sidebar = document.querySelector('.desktop-sidebar');
    const content = document.querySelector('.desktop-content');
    const toggleButton = document.querySelector('.instructions-toggle');
    const overlay = document.querySelector('.sidebar-overlay');
    
    // Check if we're in mobile view
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Mobile toggle logic
        const isOpen = sidebar.classList.contains('open');
        if (!isOpen) {
            sidebar.classList.add('open');
            overlay.classList.add('active');
            toggleButton.setAttribute('aria-expanded', 'true');
            // Ensure instructions tab is active
            switchSidebarTab('instructions');
        } else {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
            toggleButton.setAttribute('aria-expanded', 'false');
        }
    } else {
        // Desktop toggle logic
        const container = document.getElementById('instructions-container');
        const isCollapsed = !container.classList.contains('collapsed');
        
        container.classList.toggle('collapsed');
        toggleButton.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
        
        if (!isCollapsed) {
            sidebar.style.width = 'var(--sidebar-width)';
            content.style.marginLeft = 'var(--sidebar-width)';
            toggleButton.classList.remove('sidebar-collapsed');
            toggleButton.classList.add('expanded');
        } else {
            sidebar.style.width = '180px';
            content.style.marginLeft = '180px';
            toggleButton.classList.add('sidebar-collapsed');
            toggleButton.classList.remove('expanded');
        }
        
        if (isCollapsed) {
            switchSidebarTab('instructions');
        }
    }
}

function switchSidebarTab(tabName) {
    console.log('Switching to tab:', tabName); // Debug logging
    
    // Normalize the tab name
    const targetTab = document.querySelector(`.sidebar-tab[data-tab="${tabName}"]`);
    if (!targetTab) {
        console.error('Tab not found:', tabName);
        return;
    }
    
    // Update all tabs
    document.querySelectorAll('.sidebar-tab').forEach(tab => {
        const isActive = tab.dataset.tab === tabName;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', isActive.toString());
        if (!isActive) {
            tab.setAttribute('tabindex', '-1');
        } else {
            tab.setAttribute('tabindex', '0');
            tab.focus(); // Focus the selected tab
        }
    });
    
    // Update all panels
    document.querySelectorAll('.sidebar-content-panel').forEach(panel => {
        panel.classList.remove('active');
        panel.style.cssText = 'display: none !important; visibility: hidden !important;';
        panel.setAttribute('aria-hidden', 'true');
    });
    
    // Show target panel
    const targetPanel = document.getElementById(`${tabName}-panel`);
    if (targetPanel) {
        targetPanel.classList.add('active');
        targetPanel.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; z-index: 1000;';
        targetPanel.setAttribute('aria-hidden', 'false');
        console.log('Activated panel:', targetPanel.id); // Debug logging
        
        // Set focus to panel if activated by keyboard
        if (window.mostRecentKeyboardEvent) {
            targetPanel.focus();
            window.mostRecentKeyboardEvent = false;
        }
    } else {
        console.error('Panel not found:', `${tabName}-panel`);
    }
}

// ========================================
// VALIDATION FUNCTIONS - FIXED
// ========================================

function validateStep(step) {
    switch(step) {
        case 1:
            if (!AppState.selectedScenario) return false;
            if (AppState.selectedScenario === 'custom') {
                return validateCustomText('custom-scenario');
            }
            return true;
            
        case 2:
            if (AppState.userValues.length !== 3) return false;
            for (const value of AppState.userValues) {
                if (value === 'Other (user)') {
                    if (!validateCustomText('custom-value-user')) return false;
                } else if (value.startsWith('Other-user-')) {
                    const cardNumber = value.split('-')[2];
                    if (!validateCustomText(`custom-value-user-${cardNumber}`)) return false;
                }
            }
            return true;
            
        case 3:
            if (!AppState.selectedStakeholder) return false;
            if (AppState.selectedStakeholder === 'other') {
                return validateCustomText('custom-stakeholder');
            }
            return true;
            
        case 4:
            if (AppState.stakeholderValues.length !== 3) return false;
            for (const value of AppState.stakeholderValues) {
                if (value === 'Other (stakeholder)') {
                    if (!validateCustomText('custom-value-stakeholder')) return false;
                } else if (value.startsWith('Other-stakeholder-')) {
                    const cardNumber = value.split('-')[2];
                    if (!validateCustomText(`custom-value-stakeholder-${cardNumber}`)) return false;
                }
            }
            return true;
            
        default:
            return true;
    }
}

function canFinish() {
    // Remove email validation - just return true for step 5
    return true;
}

// ========================================
// NAVIGATION FUNCTIONS
// ========================================

function updateHeader() {
    // Update progress bar
    const progressBar = document.querySelector('.progress');
    if (progressBar) {
        progressBar.setAttribute('aria-valuenow', AppState.currentStep);
    }
    
    document.getElementById('desktopTitle').textContent = titles[AppState.currentStep];
    document.getElementById('desktopSubtitle').textContent = subtitles[AppState.currentStep];
}

function updateNavigation() {
    const backBtn = document.getElementById('desktopBackBtn');
    const nextBtn = document.getElementById('desktopNextBtn');
    
    // Force display block for steps 2-5, none for step 1
    if (AppState.currentStep > 1) {
        backBtn.style.removeProperty('display');  // Use default display
        backBtn.style.display = 'block';
    } else {
        backBtn.style.display = 'none';
    }
    
    if (AppState.currentStep === 5) {
        nextBtn.style.display = 'none';
    } else {
        nextBtn.style.display = 'block';
        nextBtn.disabled = !validateStep(AppState.currentStep);
    }
}

function nextStep() {
    if (AppState.currentStep < 5) {
        emptyText = false;
        document.querySelectorAll('.selected').forEach((element) => {
            //alert(element.classList.value.includes('custom'));
            if((element.classList.value.includes('custom') || element.classList.value.includes('Custom')) && element.querySelector('textarea').value === '')
            { 
                alert("You have selected an empty Custom card. Please add text or select a different card."); 
                emptyText = true;
            }
            
        }) 
        if(emptyText){return;}  
        const currentStep = document.getElementById(`step-${AppState.currentStep}`);
        currentStep.classList.remove('active');
        currentStep.setAttribute('aria-hidden', 'true');
        document.getElementById(`progress-${AppState.currentStep}`).classList.remove('current');
        document.getElementById(`progress-${AppState.currentStep}`).classList.add('completed');
        
        AppState.currentStep++;
        
        // Update back button visibility immediately
        const backBtn = document.getElementById('desktopBackBtn');
        backBtn.style.display = AppState.currentStep > 1 ? 'block' : 'none';
        
        const nextStep = document.getElementById(`step-${AppState.currentStep}`);
        nextStep.classList.add('active');
        nextStep.removeAttribute('aria-hidden');
        document.getElementById(`progress-${AppState.currentStep}`).classList.add('current');

        const stepHeading = document.querySelector(`#step-${AppState.currentStep} h1`);
        if (stepHeading) stepHeading.focus();

        document.querySelectorAll('.step').forEach(step => {
            step.setAttribute('aria-hidden', 'true');
        });
        document.getElementById(`step-${AppState.currentStep}`).setAttribute('aria-hidden', 'false');

        updateHeader();
        utils.announceToScreenReader(`Moved to ${titles[AppState.currentStep]}`);
        updateStakeholderSubtitle();
        updateNavigation();
    }
}

function previousStep() {
    if (AppState.currentStep > 1) {
        
        const currentStep = document.getElementById(`step-${AppState.currentStep}`);
        currentStep.classList.remove('active');
        currentStep.setAttribute('aria-hidden', 'true');
        document.getElementById(`progress-${AppState.currentStep}`).classList.remove('current');
        
        AppState.currentStep--;
        const prevStep = document.getElementById(`step-${AppState.currentStep}`);
        prevStep.classList.add('active');
        prevStep.removeAttribute('aria-hidden');
        document.getElementById(`progress-${AppState.currentStep}`).classList.remove('completed');
        document.getElementById(`progress-${AppState.currentStep}`).classList.add('current');
        
        updateHeader();
        updateNavigation();
    }
}

function resetToStep1() {
    // Hide back button when resetting to step 1
    document.getElementById('desktopBackBtn').style.display = 'none';
    // Clear all selections
    clearAllSelections('.scenario-card');
    clearAllSelections('.stakeholder-card');
    clearAllSelections('.value-card');
    
    // Clear all textareas
    document.querySelectorAll('textarea').forEach(textarea => {
        textarea.value = '';
    });
    
    // Clear character counts
    document.querySelectorAll('.current-count').forEach(counter => {
        counter.textContent = '0';
        counter.parentNode.classList.remove('warning');
    });
    
    // Reset state
    AppState.selectedScenario = null;
    AppState.selectedStakeholder = null;
    AppState.userValues = [];
    AppState.stakeholderValues = [];
    
    // Reset progress indicators and step visibility
    for (let i = 1; i <= 5; i++) {
        document.getElementById(`progress-${i}`).classList.remove('completed', 'current');
        const step = document.getElementById(`step-${i}`);
        step.classList.remove('active');
        if (i === 1) {
            step.classList.add('active');
            step.removeAttribute('aria-hidden');
        } else {
            step.setAttribute('aria-hidden', 'true');
        }
    }
    
    // Set step 1 active
    document.getElementById('step-1').classList.add('active');
    document.getElementById('progress-1').classList.add('current');
    AppState.currentStep = 1;

    document.querySelectorAll('.step').forEach(step => {
        step.setAttribute('aria-hidden', 'true');
    });
    document.getElementById('step-1').setAttribute('aria-hidden', 'false');
    
    // Update UI
    updateHeader();
    updateNavigation();
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// SELECTION FUNCTIONS //
function selectScenario(element, scenarioId) {
    try {
        if (AppState.selectedScenario === scenarioId && element.classList.contains('selected')) {
            element.classList.remove('selected');
            AppState.selectedScenario = null;
            /*
            if (scenarioId === 'custom' && OriginalElements.customScenario) {
                OriginalElements.customScenario.value = '';
                if (OriginalElements.scenarioCharCount) {
                    OriginalElements.scenarioCharCount.textContent = '0';
                }
            }
            */
            updateNavigation();
            return;
        }
        
        clearAllSelections('.scenario-card');
        element.classList.add('selected');
        AppState.selectedScenario = scenarioId;
        /*
        if (scenarioId !== 'custom' && OriginalElements.customScenario) {
            OriginalElements.customScenario.value = '';
            if (OriginalElements.scenarioCharCount) {
                OriginalElements.scenarioCharCount.textContent = '0';
            }
        }
        */
        updateNavigation();
    } catch (error) {
        utils.showError('Error selecting scenario');
        console.error('Scenario selection error:', error);
    }
}

function selectValue(element, valueId, mode) {
    try {
        const targetArray = mode === 'user' ? AppState.userValues : AppState.stakeholderValues;
        let changed = false;
        
        // Helper to update ARIA states
        const updateAriaStates = (isSelected) => {
            element.setAttribute('aria-pressed', isSelected.toString());
            if (isSelected) {
                element.classList.add('selected');
            } else {
                element.classList.remove('selected');
            }
        };

        // Handle all types of "Other" cards
        if (valueId === 'Other' || valueId.startsWith('Other-')) {
            let uniqueOtherId;
            let textarea = element.querySelector('textarea');
            
            // Determine unique ID
            uniqueOtherId = valueId === 'Other' ? `Other (${mode})` : valueId;
            
            // Check textarea content
            const hasText = textarea && textarea.value.trim().length > 0;
          //  alert(targetArray);
            if (targetArray.includes(uniqueOtherId)) {
                // Deselect and clear
               /*
                if (textarea) {
                    textarea.value = '';
                    // Update character count
                    const charCountId = textarea.id.replace('custom-value-', 'value-char-count-');
                    const charCountElement = document.getElementById(charCountId);
                    if (charCountElement) charCountElement.textContent = '0';
                }
                */
                updateAriaStates(false);
                const index = targetArray.indexOf(uniqueOtherId);
                targetArray.splice(index, 1);
                changed = true;
                
                // Announce deselection to screen readers
                const announcement = `${valueId.replace('Other-', 'Custom value ')} deselected`;
                utils.announceToScreenReader(announcement);
            } else {
                // Handle selection attempt
                if (!hasText) {
                    if (textarea) {
                        textarea.focus();
                        // Announce to screen readers
                        utils.announceToScreenReader('Please enter a custom value description');
                    }
                    return;
                }
                
                if (targetArray.length >= 3) {
                    utils.showError('You can only select 3 values. Deselect one first.');
                    utils.announceToScreenReader('Maximum of 3 values already selected. Please deselect one first.');
//Jakob: should this read out to the user which have already been selected?
                    return;
                }
                
                targetArray.push(uniqueOtherId);
                updateAriaStates(true);
                changed = true;
                
                // Announce selection to screen readers
                const announcement = `${valueId.replace('Other-', 'Custom value ')} selected`;
                utils.announceToScreenReader(announcement);
            }
        } else {
            // Handle regular value cards
            if (targetArray.includes(valueId)) {
                // Deselect
                const index = targetArray.indexOf(valueId);
                targetArray.splice(index, 1);
                updateAriaStates(false);
                changed = true;
                utils.announceToScreenReader(`${valueId} deselected`);
            } else if (targetArray.length < 3) {
                // Select
                targetArray.push(valueId);
                updateAriaStates(true);
                changed = true;
                utils.announceToScreenReader(`${valueId} selected`);
            } else {
                utils.showError('You can only select 3 values. Deselect one first.');
                utils.announceToScreenReader('Maximum of 3 values already selected. Please deselect one first.');
                return;
            }
        }
        
        // Update UI state
        updateCounter(mode, targetArray.length);
        updateNavigation();

        //alert(targetArray);
        
        // Announce selection count to screen readers
        const remainingSelections = 3 - targetArray.length;
        if (remainingSelections > 0) {
            utils.announceToScreenReader(`${remainingSelections} more selection${remainingSelections !== 1 ? 's' : ''} allowed`);
        }
    } catch (error) {
        utils.showError('Error selecting value');
        console.error('Value selection error:', error);
    }
}

function selectStakeholder(element, stakeholderId) {
    // Helper to update ARIA states
    const updateAriaStates = (isSelected) => {
        element.setAttribute('aria-pressed', isSelected.toString());
        if (isSelected) {
            element.classList.add('selected');
        } else {
            element.classList.remove('selected');
        }
        
        // Update other cards' ARIA pressed state
        document.querySelectorAll('.stakeholder-card').forEach(card => {
            if (card !== element) {
                card.setAttribute('aria-pressed', 'false');
            }
        });
    };

    if (stakeholderId !== 'other') {
        if (AppState.selectedStakeholder === stakeholderId && element.classList.contains('selected')) {
            updateAriaStates(false);
            AppState.selectedStakeholder = null;
            AppState.selectedStakeholderName = null;
            utils.announceToScreenReader(`${element.querySelector('h3').textContent} deselected`);
        } else {
            clearAllSelections('.stakeholder-card');
            updateAriaStates(true);
            AppState.selectedStakeholder = stakeholderId;
            AppState.selectedStakeholderName = element.querySelector('h3').textContent;
            utils.announceToScreenReader(`${AppState.selectedStakeholderName} selected as stakeholder`);
        }
        updateNavigation();
        return;
    }
    
    const textarea = element.querySelector('textarea');
    
    if (AppState.selectedStakeholder === 'other' && element.classList.contains('selected')) {
        updateAriaStates(false);
        AppState.selectedStakeholder = null;
        AppState.selectedStakeholderName = null;
       /*
        textarea.value = '';
        if (OriginalElements.stakeholderCharCount) {
            OriginalElements.stakeholderCharCount.textContent = '0';
        */
        utils.announceToScreenReader('Custom stakeholder deselected');
    } else {
        clearAllSelections('.stakeholder-card');
        updateAriaStates(true);
        AppState.selectedStakeholder = 'other';
        if (textarea.value.trim()) {
            AppState.selectedStakeholderName = textarea.value;
            utils.announceToScreenReader(`Custom stakeholder "${textarea.value}" selected`);
        } else {
            AppState.selectedStakeholderName = 'Other';
            utils.announceToScreenReader('Please enter a description for the custom stakeholder');
            textarea.focus();
        }
    }
    
    updateNavigation();
}

function updateStakeholderSubtitle() {
    const subtitle = document.getElementById('desktopSubtitle');
    if (AppState.currentStep === 4) {
        subtitle.textContent = `Choose 3 values from ${AppState.selectedStakeholderName}'s perspective`;
    } else if (AppState.currentStep === 3) {
        subtitle.textContent = "Choose a different stakeholder perspective";
    }
}


// CUSTOM TEXT HANDLERS // 

const debouncedUpdateCustomScenario = utils.debounce(function(textarea) {
    //alert(textarea.value);
    utils.updateCharacterCount(textarea, OriginalElements.scenarioCharCount);
    
    if (textarea.value.trim().length > 0) {
        clearAllSelections('.scenario-card:not(.custom-scenario-card)');
        textarea.closest('.scenario-card').classList.add('selected');
        AppState.selectedScenario = 'custom';
    } else {
        textarea.closest('.scenario-card').classList.remove('selected');
        if (AppState.selectedScenario === 'custom') {
            AppState.selectedScenario = null;
        }
    }
    
    updateNavigation();
}, 300);

function updateCustomScenario(textarea) {
    debouncedUpdateCustomScenario(textarea);
}

function updateCustomValue(textarea, mode) {
    
    const charCountElement = mode === 'user' ? OriginalElements.valueCharCountUser : OriginalElements.valueCharCountStakeholder;
    utils.updateCharacterCount(textarea, charCountElement);
    //alert(OriginalElements.valueCharCountStakeholder.innerHTML);
    const customCard = textarea.closest('.value-card');
    const targetArray = mode === 'user' ? AppState.userValues : AppState.stakeholderValues;
    const uniqueOtherId = `Other (${mode})`;
    //alert(textarea.value);
    
    if (textarea.value.trim().length > 0) {
        if (!targetArray.includes(uniqueOtherId)) {
            if (targetArray.length >= 3) return;
            targetArray.push(uniqueOtherId);
            customCard.classList.add('selected');
            updateCounter(mode, targetArray.length);
        }
    } else {
        if (targetArray.includes(uniqueOtherId)) {
            const index = targetArray.indexOf(uniqueOtherId);
            targetArray.splice(index, 1);
            customCard.classList.remove('selected');
            updateCounter(mode, targetArray.length);
        }
    }
    
    updateNavigation();
    if (AppState.currentStep === 5) updateComparison();
}

function updateCustomStakeholder(textarea) {
    utils.updateCharacterCount(textarea, OriginalElements.stakeholderCharCount);
    
    const customCard = textarea.closest('.stakeholder-card');
    
    if (textarea.value.trim().length > 0) {
        clearAllSelections('.stakeholder-card:not(.custom-stakeholder-card)');
        customCard.classList.add('selected');
        customCard.classList.add('has-content');
        AppState.selectedStakeholder = 'other';
        
        const customText = textarea.value.length > 30 ? 
            textarea.value.substring(0, 30) + '...' : 
            textarea.value;
        AppState.selectedStakeholderName = `Other: ${customText}`;
    } else {
        customCard.classList.remove('selected');
        customCard.classList.remove('has-content');
        if (AppState.selectedStakeholder === 'other') {
            AppState.selectedStakeholder = null;
            AppState.selectedStakeholderName = null;
        }
    }
    
    updateNavigation();
}

// ========================================
// COMPARISON AND DISPLAY FUNCTIONS
// ========================================

function updateComparison() {
    const scenarioDisplay = document.getElementById('scenario-display');
    let scenarioText = '';
    
    if (AppState.selectedScenario === 'custom') {
        const customScenarioText = OriginalElements.customScenario?.value || '';
        scenarioText = customScenarioText ? `Custom: ${customScenarioText}` : 'Custom Scenario';
    } else {
        const scenarioNames = {
            'article-summary': 'A third-party service that uses AI to generate brief summaries of research articles for students and faculty. <br>(Project Stage: Post-implementation)',
            'chatbot-reference': 'A third-party AI chatbot to provide online reference for students on evenings and weekends. <br>Project stage: Information gathering stage, pre-implementation',
            'automated-metadata': 'A locally-built computer vision tool to create metadata for classification and discovery of digital photographs documenting labor organizing in your area. <br>Project Stage: Mid-implementation, testing the tool on some photographs',
            'resource-recommendations': 'An open source, AI-powered resource recommender system to help users more easily search and find resources they need from the library databases. <br>Project Stage: Post-implementation'
        };
        scenarioText = scenarioNames[AppState.selectedScenario] || AppState.selectedScenario;
    }
    
    if (scenarioDisplay) {
        scenarioDisplay.innerHTML = `<span class="comparison-tag">${scenarioText}</span>`;
    }
    
    const stakeholderTitle = document.getElementById('stakeholder-values-title');
    if (stakeholderTitle) {
        stakeholderTitle.textContent = AppState.selectedStakeholderName ? 
            `${AppState.selectedStakeholderName}'s Values` : 
            "Stakeholder's Values";
    }
    
    const userValuesDisplay = document.getElementById('user-values-display');
    if (userValuesDisplay) {
        userValuesDisplay.innerHTML = AppState.userValues
            .map(value => `<span class="comparison-tag">${utils.formatValueForDisplay(value, 'user')}</span>`)
            .join('');
    }
    
    const stakeholderValuesDisplay = document.getElementById('stakeholder-values-display');
    if (stakeholderValuesDisplay) {
        stakeholderValuesDisplay.innerHTML = AppState.stakeholderValues
            .map(value => `<span class="comparison-tag">${utils.formatValueForDisplay(value, 'stakeholder')}</span>`)
            .join('');
    }
    
    const sharedValues = AppState.userValues.filter(userValue => {
        if (userValue.startsWith('Other (')) return false;
        return AppState.stakeholderValues.includes(userValue);
    });
    
    const sharedValuesDisplay = document.getElementById('shared-values-display');
    if (sharedValuesDisplay) {
        sharedValuesDisplay.innerHTML = sharedValues.length > 0 ? 
            sharedValues.map(value => `<span class="comparison-tag shared-tag">${value}</span>`).join('') :
            '<span style="color: #888; font-style: italic;">No shared values</span>';
    }
}

function generatePrintableContent() {
  const customScenarioText = document.getElementById('custom-scenario')?.value || '';
  const customUserValueText = document.getElementById('custom-value-user')?.value || '';
  const customStakeholderText = document.getElementById('custom-stakeholder')?.value || '';
  const customStakeholderValueText = document.getElementById('custom-value-stakeholder')?.value || '';

  const scenarioDisplayElement = document.getElementById('scenario-display');
  const scenarioText = scenarioDisplayElement?.textContent.trim() || 'N/A';

  const userValues = AppState.userValues.map(value => {
    if (value === 'Other (user)') return customUserValueText;
    if (value.startsWith('Other-user-')) {
        const cardNumber = value.split('-')[2];
        return document.getElementById(`custom-value-user-${cardNumber}`)?.value || 'Custom Value';
    }
    return value;
  });

  const stakeholderValues = AppState.stakeholderValues.map(value => {
    if (value === 'Other (stakeholder)') return customStakeholderValueText;
    if (value.startsWith('Other-stakeholder-')) {
        const cardNumber = value.split('-')[2];
        return document.getElementById(`custom-value-stakeholder-${cardNumber}`)?.value || 'Custom Value';
    }
    return value;
  });

  const stakeholderName = document.getElementById('stakeholder-values-title')?.textContent.replace("'s Values", "").trim() || 'N/A';

  const reflectionAnswers = {
    q1: document.getElementById('q1')?.value || '',
    q2: document.getElementById('q2')?.value || '',
    q3: document.getElementById('q3')?.value || ''
  };

  const sharedValues = userValues.filter(v => stakeholderValues.includes(v));

  let htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Values Exercise Summary</title>
        <style>
            body { font-family: sans-serif; line-height: 1.6; padding: 20px; }
            h1, h2 { color: #333; border-bottom: 2px solid #ccc; padding-bottom: 5px; }
            .section { margin-bottom: 20px; }
            .section-title { font-weight: bold; margin-bottom: 5px; }
            ul { list-style-type: none; padding: 0; }
            li { margin-bottom: 5px; }
            .answer { white-space: pre-wrap; background: #f9f9f9; padding: 10px; border-radius: 5px; }
            @media print {
                body { font-size: 12pt; }
            }
        </style>
    </head>
    <body>
        <h1>Values Exercise Summary</h1>
        <div class="section">
            <h2>Scenario</h2>
            <p class="section-title">Selected Scenario:</p>
            <p>${scenarioText}</p>
        </div>
        <div class="section">
            <h2>Your Values</h2>
            <ul>
                ${userValues.map(val => `<li>${val}</li>`).join('')}
            </ul>
        </div>
        <div class="section">
            <h2>${stakeholderName} Values</h2>
            <ul>
                ${stakeholderValues.map(val => `<li>${val}</li>`).join('')}
            </ul>
        </div>
        <div class="section">
            <h2>Shared Values</h2>
            <ul>
                ${sharedValues.length > 0 ? sharedValues.map(val => `<li>${val}</li>`).join('') : '<li>No shared values.</li>'}
            </ul>
        </div>
        <div class="section">
            <h2>Your Reflection</h2>
            <div class="reflection-q">
                <p class="section-title">Question 1: What differences in values did you notice between yourself and the stakeholder?</p>
                <div class="answer">${reflectionAnswers.q1}</div>
            </div>
            <div class="reflection-q">
                <p class="section-title">Question 2: What tensions or conflicts might arise from these differences?</p>
                <div class="answer">${reflectionAnswers.q2}</div>
            </div>
            <div class="reflection-q">
                <p class="section-title">Question 3: How might you address these tensions in practice?</p>
                <div class="answer">${reflectionAnswers.q3}</div>
            </div>
        </div>
    </body>
    </html>
  `;
  return htmlContent;
}

// ========================================
// MOBILE SIDEBAR FUNCTIONS
// ========================================

function toggleMobileInstructions() {
    const sidebar = document.querySelector('.desktop-sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (!overlay) createSidebarOverlay();
    
    if (sidebar.classList.contains('open')) {
        closeMobileSidebar();
    } else {
        openMobileSidebar();
    }
}

function openMobileSidebar() {
    const sidebar = document.querySelector('.desktop-sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    sidebar.classList.add('open');
    if (overlay) overlay.classList.add('active');
    const container = document.getElementById('instructions-container');
    if (container) container.classList.remove('collapsed');
    document.body.style.overflow = 'hidden';
    
    // Initialize with instructions tab
    switchSidebarTab('instructions');
    
    // Add touch event listeners to tabs
    document.querySelectorAll('.sidebar-tab').forEach(tab => {
        // Remove existing listeners to prevent duplicates
        tab.removeEventListener('touchend', handleTabTouch);
        tab.addEventListener('touchend', handleTabTouch);
    });
}

function handleTabTouch(e) {
    e.preventDefault();
    const tabName = this.dataset.tab;
    if (tabName) {
        switchSidebarTab(tabName);
    }
}

function closeMobileSidebar() {
    const sidebar = document.querySelector('.desktop-sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
}

function createSidebarOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.onclick = closeMobileSidebar;
    
    const desktopContainer = document.querySelector('.desktop');
    desktopContainer.parentNode.insertBefore(overlay, desktopContainer);
}



function startOver() {
    // Reset all state and UI elements
    AppState.reset(); // Use the existing reset function on AppState
    
    // Reset UI counters and elements
    customValueCount = 1;
    customStakeholderValueCount = 1;
    document.getElementById('add-value-button').style.display = 'flex';
    document.getElementById('add-stakeholder-value-button').style.display = 'flex';
    
    // Remove dynamically added custom cards, leave initial card
    document.querySelectorAll('.custom-user-value').forEach((element, index) => {
        if(index > 0){
            element.remove();
        }
    });
    document.querySelectorAll('.custom-stakeholder-value').forEach((element, index) => {
        if(index > 0){
            element.remove();
        }
    });
    document.querySelectorAll('.current-count.warning').forEach((element) => {
        element.classList.remove('warning');
    });
    
    // Reset all selection counters
    updateCounter('user', 1);
    updateCounter('stakeholder', 1);

    // Call the existing reset function
    resetToStep1();
}

function downloadWorksheet() {
    const printableContent = generatePrintableContent();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printableContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
}

// EVENT LISTENERS // 
document.addEventListener('DOMContentLoaded', function() {
    // Initialize aria-hidden on all non-active steps
    document.querySelectorAll('.step').forEach(step => {
        if (!step.classList.contains('active')) {
            step.setAttribute('aria-hidden', 'true');
        }
    });

    // Remove any existing toggle buttons first
    const existingButtons = document.querySelectorAll('.instructions-toggle');
    existingButtons.forEach(btn => btn.remove());
    
    // Create single toggle button
    const toggleButton = document.createElement('button');
    toggleButton.className = 'instructions-toggle';
    toggleButton.setAttribute('aria-expanded', 'false');
    toggleButton.setAttribute('aria-controls', 'instructions-container');
    toggleButton.setAttribute('aria-label', 'Toggle instructions panel');
    toggleButton.innerHTML = '<span class="toggle-icon" aria-hidden="true"></span>';
    toggleButton.onclick = toggleInstructions;
    document.body.appendChild(toggleButton);
    
    // Initialize navigation
    AppState.currentStep = 1;  // Ensure we start at step 1
    updateNavigation();
    
    // Step 5 observer for comparison updates
    const step5 = document.getElementById('step-5');
    if (step5) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.target.classList.contains('active')) {
                    updateComparison();
                }
            });
        });
        observer.observe(step5, { attributes: true, attributeFilter: ['class'] });
    }

    // Add event listener for the download/print button
    const downloadButton = document.querySelector('.download-button');
    if (downloadButton) {
        downloadButton.addEventListener('click', downloadWorksheet);
    }

    // Add event listener for the start over button
    const startOverButton = document.querySelector('.start-over-btn');
    if (startOverButton) {
        startOverButton.addEventListener('click', startOver);
    }
    
    // Mobile sidebar setup
    if (window.innerWidth <= 768) createSidebarOverlay();

    // Set initial aria-hidden states
    document.querySelectorAll('.step').forEach(step => {
        step.setAttribute('aria-hidden', 'true');
    });
    document.getElementById('step-1').setAttribute('aria-hidden', 'false');
});

// Mobile event listeners
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') closeMobileSidebar();
});

window.addEventListener('resize', function() {
    if (window.innerWidth > 768) closeMobileSidebar();
});

// ========================================
// GLOBAL FUNCTION EXPORTS
// ========================================

// Make functions globally available for onclick handlers

window.switchSidebarTab = switchSidebarTab;

// Add to DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize sidebar tabs
    const tabs = document.querySelectorAll('.sidebar-tab');
    
    tabs.forEach(tab => {
        // Click and touch events
        ['click', 'touchend'].forEach(eventType => {
            tab.addEventListener(eventType, function(e) {
                e.preventDefault();
                const tabName = this.dataset.tab;
                if (tabName) {
                    window.mostRecentKeyboardEvent = false;
                    switchSidebarTab(tabName);
                }
            });
        });
        
        // Keyboard event handling
        tab.addEventListener('keydown', function(e) {
            const targetTab = e.target;
            let newTab = null;
            
            switch(e.key) {
                case 'ArrowLeft':
                    newTab = targetTab.previousElementSibling;
                    if (!newTab || !newTab.classList.contains('sidebar-tab')) {
                        newTab = tabs[tabs.length - 1];
                    }
                    break;
                case 'ArrowRight':
                    newTab = targetTab.nextElementSibling;
                    if (!newTab || !newTab.classList.contains('sidebar-tab')) {
                        newTab = tabs[0];
                    }
                    break;
                case 'Home':
                    newTab = tabs[0];
                    break;
                case 'End':
                    newTab = tabs[tabs.length - 1];
                    break;
                case ' ':
                case 'Enter':
                    e.preventDefault();
                    window.mostRecentKeyboardEvent = true;
                    switchSidebarTab(targetTab.dataset.tab);
                    return;
            }
            
            if (newTab) {
                e.preventDefault();
                window.mostRecentKeyboardEvent = true;
                switchSidebarTab(newTab.dataset.tab);
            }
        });
    });

});