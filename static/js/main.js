// DOM Elements
const fearDescription = document.getElementById('fearDescription');
const analyzeBtn = document.getElementById('analyzeBtn');
const charCount = document.getElementById('charCount');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');
const newAnalysisBtn = document.getElementById('newAnalysisBtn');
const retryBtn = document.getElementById('retryBtn');
const shareBtn = document.getElementById('shareBtn');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    updateCharCount();
});

function setupEventListeners() {
    // Form submission
    document.getElementById('phobiaForm').addEventListener('submit', handleFormSubmit);
    
    // Character count update
    fearDescription.addEventListener('input', updateCharCount);
    
    // Button click handlers
    newAnalysisBtn.addEventListener('click', resetForm);
    retryBtn.addEventListener('click', retryAnalysis);
    shareBtn.addEventListener('click', shareResults);
    
    // Modal event listeners
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('infoModal');
        if (event.target === modal) {
            closeModal();
        }
    });
}

function updateCharCount() {
    const count = fearDescription.value.length;
    charCount.textContent = count;
    
    // Update color based on character count
    if (count > 900) {
        charCount.style.color = '#ff6b6b';
    } else if (count > 700) {
        charCount.style.color = '#feca57';
    } else {
        charCount.style.color = '#888';
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    const description = fearDescription.value.trim();
    
    // Validation
    if (!description) {
        showError('Please describe your fear or anxiety.');
        return;
    }
    
    if (description.length < 10) {
        showError('Please provide a more detailed description (at least 10 characters).');
        return;
    }
    
    // Show loading state
    showLoading();
    
    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ description: description })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Analysis failed');
        }
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        displayResults(data);
        
    } catch (error) {
        console.error('Analysis error:', error);
        showError(error.message || 'An error occurred while analyzing your description. Please try again.');
    }
}

function showLoading() {
    hideAllSections();
    loadingSection.style.display = 'block';
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
}

function hideAllSections() {
    loadingSection.style.display = 'none';
    resultsSection.style.display = 'none';
    errorSection.style.display = 'none';
}

function showError(message) {
    hideAllSections();
    document.getElementById('errorMessage').textContent = message;
    errorSection.style.display = 'block';
    resetAnalyzeButton();
}

function resetAnalyzeButton() {
    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = '<i class="fas fa-search"></i> Analyze My Fear';
}

function displayResults(data) {
    hideAllSections();
    
    // Populate phobia identification
    document.getElementById('phobiaName').textContent = data.phobia_name || 'Not identified';
    document.getElementById('commonName').textContent = data.common_name || '';
    document.getElementById('phobiaDescription').textContent = data.description || '';
    
    // Set severity badge
    const severityElement = document.getElementById('severityLevel');
    const severity = (data.severity_assessment || 'unknown').toLowerCase();
    severityElement.textContent = severity;
    severityElement.className = `severity-${severity}`;
    
    // Populate symptoms
    populateList('symptomsList', data.symptoms || []);
    
    // Populate coping strategies
    populateList('copingList', data.coping_strategies || []);
    
    // Populate professional help
    document.getElementById('professionalHelp').textContent = 
        data.professional_help || 'Consider consulting with a mental health professional for proper evaluation.';
    
    // Populate resources
    populateList('resourcesList', data.helpful_resources || []);
    
    // Set confidence level
    setConfidenceLevel(data.confidence || '0%');
    
    resultsSection.style.display = 'block';
    resetAnalyzeButton();
    
    // Smooth scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function populateList(elementId, items) {
    const listElement = document.getElementById(elementId);
    listElement.innerHTML = '';
    
    if (!items || items.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No specific information available';
        li.style.fontStyle = 'italic';
        li.style.color = '#999';
        listElement.appendChild(li);
        return;
    }
    
    items.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        listElement.appendChild(li);
    });
}

function setConfidenceLevel(confidenceStr) {
    const confidenceText = document.getElementById('confidenceText');
    const confidenceFill = document.getElementById('confidenceLevel');
    
    // Extract percentage from string
    const match = confidenceStr.match(/(\d+)/);
    const percentage = match ? parseInt(match[1]) : 0;
    
    confidenceText.textContent = confidenceStr;
    confidenceFill.style.width = `${Math.min(percentage, 100)}%`;
    
    // Animate the fill
    setTimeout(() => {
        confidenceFill.style.width = `${Math.min(percentage, 100)}%`;
    }, 100);
}

function resetForm() {
    fearDescription.value = '';
    updateCharCount();
    hideAllSections();
    fearDescription.focus();
    
    // Smooth scroll to top
    document.querySelector('.input-section').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
}

function retryAnalysis() {
    hideAllSections();
    handleFormSubmit(new Event('submit'));
}

async function shareResults() {
    const phobiaName = document.getElementById('phobiaName').textContent;
    const commonName = document.getElementById('commonName').textContent;
    
    const shareText = `I learned about ${phobiaName}${commonName ? ` (${commonName})` : ''} using PhobiaSupport - an AI-powered tool for understanding fears and anxieties.`;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'PhobiaSupport Analysis',
                text: shareText,
                url: window.location.href
            });
        } catch (error) {
            if (error.name !== 'AbortError') {
                fallbackShare(shareText);
            }
        }
    } else {
        fallbackShare(shareText);
    }
}

function fallbackShare(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Results copied to clipboard!');
        }).catch(() => {
            showToast('Unable to copy to clipboard.');
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('Results copied to clipboard!');
        } catch (error) {
            showToast('Unable to copy to clipboard.');
        }
        document.body.removeChild(textArea);
    }
}

function showToast(message) {
    // Create toast element
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #333;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        z-index: 1001;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Modal functions
function showPrivacyInfo() {
    const content = `
        <h2>Privacy Policy</h2>
        <p>Your privacy is important to us. Here's how we handle your information:</p>
        <ul>
            <li><strong>Data Collection:</strong> We only collect the fear descriptions you voluntarily provide.</li>
            <li><strong>Data Usage:</strong> Your descriptions are sent to Google's Gemini AI for analysis only.</li>
            <li><strong>Data Storage:</strong> We do not store your personal information or analysis results.</li>
            <li><strong>Data Sharing:</strong> We do not share your information with third parties beyond the AI analysis service.</li>
            <li><strong>Anonymity:</strong> All analyses are anonymous and cannot be traced back to you.</li>
        </ul>
        <p><em>This tool is for informational purposes only and should not replace professional medical advice.</em></p>
    `;
    showModal(content);
}

function showContactInfo() {
    const content = `
        <h2>Contact Information</h2>
        <p>We'd love to hear from you! If you have questions, feedback, or need support:</p>
        <div style="margin: 1.5rem 0;">
            <p><strong>Email:</strong> support@phobiasupport.com</p>
            <p><strong>Emergency:</strong> If you're in crisis, please contact:</p>
            <ul>
                <li>National Suicide Prevention Lifeline: 988</li>
                <li>Crisis Text Line: Text HOME to 741741</li>
                <li>International Association for Suicide Prevention: <a href="https://www.iasp.info/resources/Crisis_Centres/" target="_blank">Crisis Centers</a></li>
            </ul>
        </div>
        <p><em>Remember: This tool provides general information only. For professional help, please consult with a qualified mental health professional.</em></p>
    `;
    showModal(content);
}

function showAboutInfo() {
    const content = `
        <h2>About PhobiaSupport</h2>
        <p>PhobiaSupport is an AI-powered tool designed to help people understand their fears and anxieties better.</p>
        
        <h3>How It Works</h3>
        <p>Our system uses Google's Gemini AI to analyze your description and provide:</p>
        <ul>
            <li>Potential phobia identification</li>
            <li>Common symptoms and patterns</li>
            <li>Practical coping strategies</li>
            <li>Professional help recommendations</li>
            <li>Helpful resources and support options</li>
        </ul>
        
        <h3>Important Disclaimer</h3>
        <p>This tool is for educational and informational purposes only. It should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of qualified health providers with questions about mental health conditions.</p>
        
        <h3>Our Mission</h3>
        <p>We believe that understanding is the first step toward healing. By making information about fears and phobias more accessible, we hope to reduce stigma and encourage people to seek appropriate help when needed.</p>
    `;
    showModal(content);
}

function showModal(content) {
    const modal = document.getElementById('infoModal');
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = content;
    modal.style.display = 'block';
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('infoModal');
    modal.style.display = 'none';
    
    // Restore body scroll
    document.body.style.overflow = 'auto';
}

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Escape key closes modal
    if (event.key === 'Escape') {
        closeModal();
    }
    
    // Ctrl/Cmd + Enter submits form
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        if (document.activeElement === fearDescription) {
            handleFormSubmit(event);
        }
    }
});

// Auto-resize textarea
fearDescription.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 300) + 'px';
});

// Add smooth scrolling behavior
document.documentElement.style.scrollBehavior = 'smooth';