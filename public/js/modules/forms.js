// Forms Module - Handles newsletter and contact form submissions
// Optimized with validation, error handling, and user feedback

class FormsManager {
    constructor() {
        this.isInitialized = false;
        this.submissionInProgress = new Set();

        // Validation patterns
        this.patterns = {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            phone: /^[\+]?[1-9][\d]{0,15}$/,
            name: /^[a-zA-Z\s]{2,50}$/
        };

        // Rate limiting
        this.rateLimits = {
            newsletter: 60000, // 1 minute
            contact: 300000    // 5 minutes
        };
        this.lastSubmissions = new Map();
    }

    // Initialize the forms system
    init() {
        if (this.isInitialized) {
            console.warn('Forms manager already initialized');
            return;
        }

        try {
            this.initNewsletterForms();
            this.initContactForms();
            this.setupGlobalValidation();
            this.isInitialized = true;

            console.log('Forms manager initialized successfully');
        } catch (error) {
            console.error('Error initializing forms manager:', error);
        }
    }

    // Initialize newsletter subscription forms
    initNewsletterForms() {
        const newsletterForms = document.querySelectorAll('.newsletter-form');

        newsletterForms.forEach((form, index) => {
            form.setAttribute('data-form-id', `newsletter-${index}`);
            this.setupNewsletterForm(form);
        });
    }

    // Setup individual newsletter form
    setupNewsletterForm(form) {
        const emailInput = form.querySelector('input[type="email"]');
        const submitButton = form.querySelector('button[type="submit"]');

        if (!emailInput || !submitButton) {
            console.warn('Newsletter form missing required elements');
            return;
        }

        // Enhance form accessibility
        this.enhanceFormAccessibility(form, 'newsletter');

        // Add real-time validation
        this.setupRealTimeValidation(emailInput, 'email');

        // Handle form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleNewsletterSubmission(form);
        });

        // Prevent double submission
        this.preventDoubleSubmission(form);
    }

    // Handle newsletter form submission
    async handleNewsletterSubmission(form) {
        const formId = form.getAttribute('data-form-id');

        // Check if already submitting
        if (this.submissionInProgress.has(formId)) {
            return;
        }

        // Rate limiting check
        if (!this.checkRateLimit('newsletter')) {
            this.showFormMessage(form, 'Please wait before subscribing again.', 'warning');
            return;
        }

        const emailInput = form.querySelector('input[type="email"]');
        const submitButton = form.querySelector('button[type="submit"]');
        const email = emailInput.value.trim();

        // Validate email
        const validation = this.validateEmail(email);
        if (!validation.isValid) {
            this.showValidationError(emailInput, validation.message);
            return;
        }

        try {
            // Mark as submitting
            this.submissionInProgress.add(formId);
            this.setLoadingState(submitButton, true, 'Subscribing...');

            // Make API request
            const response = await fetch('/newsletter/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
                signal: AbortSignal.timeout(15000) // 15 second timeout
            });

            const data = await response.json();

            if (data.success) {
                this.handleSuccessfulSubmission(form, data.message || 'Successfully subscribed to newsletter!');
                this.updateRateLimit('newsletter');

                // Clear form
                emailInput.value = '';
                this.clearValidationState(emailInput);
            } else {
                this.showFormMessage(form, data.message || 'Subscription failed. Please try again.', 'error');
            }

        } catch (error) {
            console.error('Newsletter subscription error:', error);

            if (error.name === 'TimeoutError') {
                this.showFormMessage(form, 'Request timed out. Please try again.', 'error');
            } else if (error.name === 'TypeError') {
                this.showFormMessage(form, 'Connection error. Please check your internet connection.', 'error');
            } else {
                this.showFormMessage(form, 'An unexpected error occurred. Please try again later.', 'error');
            }
        } finally {
            this.submissionInProgress.delete(formId);
            this.setLoadingState(submitButton, false);
        }
    }

    // Initialize contact forms
    initContactForms() {
        const contactForms = document.querySelectorAll('.contact-form');

        contactForms.forEach((form, index) => {
            form.setAttribute('data-form-id', `contact-${index}`);
            this.setupContactForm(form);
        });
    }

    // Setup individual contact form
    setupContactForm(form) {
        const requiredFields = form.querySelectorAll('input[required], textarea[required]');
        const submitButton = form.querySelector('button[type="submit"]');

        if (!submitButton) {
            console.warn('Contact form missing submit button');
            return;
        }

        // Enhance form accessibility
        this.enhanceFormAccessibility(form, 'contact');

        // Add real-time validation to all fields
        requiredFields.forEach(field => {
            const fieldType = this.getFieldType(field);
            this.setupRealTimeValidation(field, fieldType);
        });

        // Handle form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleContactSubmission(form);
        });

        // Prevent double submission
        this.preventDoubleSubmission(form);

        // Auto-resize textareas
        const textareas = form.querySelectorAll('textarea');
        textareas.forEach(textarea => {
            this.setupAutoResize(textarea);
        });
    }

    // Handle contact form submission
    async handleContactSubmission(form) {
        const formId = form.getAttribute('data-form-id');

        // Check if already submitting
        if (this.submissionInProgress.has(formId)) {
            return;
        }

        // Rate limiting check
        if (!this.checkRateLimit('contact')) {
            this.showFormMessage(form, 'Please wait before sending another message.', 'warning');
            return;
        }

        // Validate all fields
        const validation = this.validateContactForm(form);
        if (!validation.isValid) {
            this.focusFirstError(form);
            return;
        }

        // Collect form data
        const formData = this.collectFormData(form);
        const submitButton = form.querySelector('button[type="submit"]');

        try {
            // Mark as submitting
            this.submissionInProgress.add(formId);
            this.setLoadingState(submitButton, true, 'Sending...');

            // Make API request
            const response = await fetch('/contact/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
                signal: AbortSignal.timeout(30000) // 30 second timeout
            });

            const data = await response.json();

            if (data.success) {
                this.handleSuccessfulSubmission(form, data.message || 'Message sent successfully!');
                this.updateRateLimit('contact');

                // Reset form
                form.reset();
                this.clearAllValidationStates(form);
            } else {
                this.showFormMessage(form, data.message || 'Failed to send message. Please try again.', 'error');
            }

        } catch (error) {
            console.error('Contact form error:', error);

            if (error.name === 'TimeoutError') {
                this.showFormMessage(form, 'Request timed out. Please try again.', 'error');
            } else if (error.name === 'TypeError') {
                this.showFormMessage(form, 'Connection error. Please check your internet connection.', 'error');
            } else {
                this.showFormMessage(form, 'An unexpected error occurred. Please try again later.', 'error');
            }
        } finally {
            this.submissionInProgress.delete(formId);
            this.setLoadingState(submitButton, false);
        }
    }

    // Enhance form accessibility
    enhanceFormAccessibility(form, formType) {
        // Add proper ARIA labels and descriptions
        const inputs = form.querySelectorAll('input, textarea, select');

        inputs.forEach((input, index) => {
            const label = form.querySelector(`label[for="${input.id}"]`) ||
                         input.closest('.form-group')?.querySelector('label');

            if (label && !input.getAttribute('aria-labelledby')) {
                if (!label.id) {
                    label.id = `${formType}-label-${index}`;
                }
                input.setAttribute('aria-labelledby', label.id);
            }

            // Add error container reference
            const errorContainer = this.getOrCreateErrorContainer(input);
            input.setAttribute('aria-describedby', errorContainer.id);
        });

        // Add form description
        if (!form.getAttribute('aria-label')) {
            const description = formType === 'newsletter'
                ? 'Newsletter subscription form'
                : 'Contact form for sending messages';
            form.setAttribute('aria-label', description);
        }
    }

    // Setup real-time validation
    setupRealTimeValidation(field, fieldType) {
        let validationTimeout;

        const validateField = () => {
            clearTimeout(validationTimeout);
            validationTimeout = setTimeout(() => {
                const value = field.value.trim();

                if (value === '') {
                    this.clearValidationState(field);
                    return;
                }

                const validation = this.validateField(value, fieldType, field);
                if (validation.isValid) {
                    this.showValidationSuccess(field);
                } else {
                    this.showValidationError(field, validation.message);
                }
            }, 500);
        };

        field.addEventListener('input', validateField);
        field.addEventListener('blur', validateField);
    }

    // Validate individual field
    validateField(value, fieldType, field) {
        const isRequired = field.hasAttribute('required');

        // Check if required field is empty
        if (isRequired && !value) {
            return {
                isValid: false,
                message: `${this.getFieldName(field)} is required.`
            };
        }

        // Skip validation for empty optional fields
        if (!value && !isRequired) {
            return { isValid: true };
        }

        // Type-specific validation
        switch (fieldType) {
            case 'email':
                return this.validateEmail(value);
            case 'name':
                return this.validateName(value);
            case 'phone':
                return this.validatePhone(value);
            case 'text':
                return this.validateText(value, field);
            default:
                return { isValid: true };
        }
    }

    // Email validation
    validateEmail(email) {
        if (!this.patterns.email.test(email)) {
            return {
                isValid: false,
                message: 'Please enter a valid email address.'
            };
        }

        // Additional checks
        if (email.length > 254) {
            return {
                isValid: false,
                message: 'Email address is too long.'
            };
        }

        return { isValid: true };
    }

    // Name validation
    validateName(name) {
        if (name.length < 2) {
            return {
                isValid: false,
                message: 'Name must be at least 2 characters long.'
            };
        }

        if (name.length > 50) {
            return {
                isValid: false,
                message: 'Name must be less than 50 characters.'
            };
        }

        if (!this.patterns.name.test(name)) {
            return {
                isValid: false,
                message: 'Name can only contain letters and spaces.'
            };
        }

        return { isValid: true };
    }

    // Phone validation
    validatePhone(phone) {
        // Remove all non-digit characters except +
        const cleanPhone = phone.replace(/[^\d+]/g, '');

        if (!this.patterns.phone.test(cleanPhone)) {
            return {
                isValid: false,
                message: 'Please enter a valid phone number.'
            };
        }

        return { isValid: true };
    }

    // Text validation (for subject, message, etc.)
    validateText(text, field) {
        const minLength = parseInt(field.getAttribute('minlength')) || 1;
        const maxLength = parseInt(field.getAttribute('maxlength')) || 1000;

        if (text.length < minLength) {
            return {
                isValid: false,
                message: `Must be at least ${minLength} characters long.`
            };
        }

        if (text.length > maxLength) {
            return {
                isValid: false,
                message: `Must be less than ${maxLength} characters.`
            };
        }

        return { isValid: true };
    }

    // Validate entire contact form
    validateContactForm(form) {
        const fields = form.querySelectorAll('input[required], textarea[required]');
        let isValid = true;
        const errors = [];

        fields.forEach(field => {
            const fieldType = this.getFieldType(field);
            const validation = this.validateField(field.value.trim(), fieldType, field);

            if (!validation.isValid) {
                isValid = false;
                errors.push({ field, message: validation.message });
                this.showValidationError(field, validation.message);
            } else {
                this.clearValidationState(field);
            }
        });

        return { isValid, errors };
    }

    // Show validation error
    showValidationError(field, message) {
        field.classList.add('error');
        field.classList.remove('success');
        field.setAttribute('aria-invalid', 'true');

        const errorContainer = this.getOrCreateErrorContainer(field);
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
    }

    // Show validation success
    showValidationSuccess(field) {
        field.classList.remove('error');
        field.classList.add('success');
        field.setAttribute('aria-invalid', 'false');

        const errorContainer = this.getOrCreateErrorContainer(field);
        errorContainer.style.display = 'none';
    }

    // Clear validation state
    clearValidationState(field) {
        field.classList.remove('error', 'success');
        field.removeAttribute('aria-invalid');

        const errorContainer = this.getOrCreateErrorContainer(field);
        errorContainer.style.display = 'none';
    }

    // Clear all validation states in form
    clearAllValidationStates(form) {
        const fields = form.querySelectorAll('input, textarea');
        fields.forEach(field => this.clearValidationState(field));
    }

    // Get or create error container for field
    getOrCreateErrorContainer(field) {
        const fieldGroup = field.closest('.form-group, .input-group') || field.parentElement;
        let errorContainer = fieldGroup.querySelector('.field-error');

        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.className = 'field-error';
            errorContainer.id = `${field.id || field.name}-error`;
            errorContainer.style.cssText = `
                color: #dc3545;
                font-size: 0.875rem;
                margin-top: 0.25rem;
                display: none;
            `;
            fieldGroup.appendChild(errorContainer);
        }

        return errorContainer;
    }

    // Get field type for validation
    getFieldType(field) {
        const type = field.type?.toLowerCase();
        const name = field.name?.toLowerCase();
        const id = field.id?.toLowerCase();

        if (type === 'email' || name?.includes('email') || id?.includes('email')) {
            return 'email';
        }
        if (name?.includes('name') || id?.includes('name')) {
            return 'name';
        }
        if (type === 'tel' || name?.includes('phone') || id?.includes('phone')) {
            return 'phone';
        }
        return 'text';
    }

    // Get human-readable field name
    getFieldName(field) {
        const label = field.closest('.form-group')?.querySelector('label');
        if (label) {
            return label.textContent.replace('*', '').trim();
        }

        return field.placeholder || field.name || 'Field';
    }

    // Collect form data
    collectFormData(form) {
        const formData = {};
        const fields = form.querySelectorAll('input, textarea, select');

        fields.forEach(field => {
            if (field.name) {
                formData[field.name] = field.value.trim();
            }
        });

        return formData;
    }

    // Handle successful form submission
    handleSuccessfulSubmission(form, message) {
        // Show success message
        this.showFormMessage(form, message, 'success');

        // For newsletter forms, replace form with success message
        if (form.classList.contains('newsletter-form')) {
            this.replaceFormWithSuccess(form, message);
        }
    }

    // Replace form with success message
    replaceFormWithSuccess(form, message) {
        const successElement = document.createElement('div');
        successElement.className = 'form-success-replacement';
        successElement.innerHTML = `
            <div style="
                background: #d4edda;
                border: 1px solid #c3e6cb;
                color: #155724;
                padding: 12px 16px;
                border-radius: 6px;
                text-align: center;
                font-size: 0.9rem;
            ">
                <i class="fas fa-check-circle" style="margin-right: 8px;"></i>
                ${message}
            </div>
        `;

        form.style.display = 'none';
        form.parentNode.insertBefore(successElement, form.nextSibling);
    }

    // Show form message
    showFormMessage(form, message, type) {
        // Remove existing messages
        const existingMessage = form.parentNode.querySelector('.form-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageElement = document.createElement('div');
        messageElement.className = `form-message form-message-${type}`;

        const bgColor = type === 'success' ? '#d4edda' :
                       type === 'warning' ? '#fff3cd' : '#f8d7da';
        const borderColor = type === 'success' ? '#c3e6cb' :
                           type === 'warning' ? '#ffeaa7' : '#f5c6cb';
        const textColor = type === 'success' ? '#155724' :
                         type === 'warning' ? '#856404' : '#721c24';
        const icon = type === 'success' ? 'check-circle' :
                    type === 'warning' ? 'exclamation-triangle' : 'exclamation-circle';

        messageElement.style.cssText = `
            background: ${bgColor};
            border: 1px solid ${borderColor};
            color: ${textColor};
            padding: 12px 16px;
            border-radius: 6px;
            margin-top: 12px;
            font-size: 0.9rem;
            animation: slideIn 0.3s ease;
        `;

        messageElement.innerHTML = `
            <i class="fas fa-${icon}" style="margin-right: 8px;"></i>
            ${message}
        `;

        form.parentNode.insertBefore(messageElement, form.nextSibling);

        // Auto-remove after delay for non-error messages
        if (type !== 'error') {
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.style.animation = 'slideOut 0.3s ease';
                    setTimeout(() => {
                        messageElement.remove();
                    }, 300);
                }
            }, 5000);
        }
    }

    // Set loading state for button
    setLoadingState(button, isLoading, loadingText = 'Loading...') {
        if (!button) return;

        if (isLoading) {
            button.disabled = true;
            button.setAttribute('data-original-text', button.textContent);
            button.textContent = loadingText;
            button.style.opacity = '0.7';
        } else {
            button.disabled = false;
            button.textContent = button.getAttribute('data-original-text') || 'Submit';
            button.removeAttribute('data-original-text');
            button.style.opacity = '';
        }
    }

    // Focus first error field
    focusFirstError(form) {
        const firstErrorField = form.querySelector('.error');
        if (firstErrorField) {
            firstErrorField.focus();
            firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // Setup auto-resize for textareas
    setupAutoResize(textarea) {
        const resize = () => {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        };

        textarea.addEventListener('input', resize);
        resize(); // Initial resize
    }

    // Prevent double submission
    preventDoubleSubmission(form) {
        const submitButton = form.querySelector('button[type="submit"]');
        if (!submitButton) return;

        form.addEventListener('submit', () => {
            setTimeout(() => {
                submitButton.disabled = true;
                setTimeout(() => {
                    submitButton.disabled = false;
                }, 1000);
            }, 100);
        });
    }

    // Rate limiting
    checkRateLimit(formType) {
        const lastSubmission = this.lastSubmissions.get(formType);
        if (!lastSubmission) return true;

        const timeSinceLastSubmission = Date.now() - lastSubmission;
        return timeSinceLastSubmission >= this.rateLimits[formType];
    }

    updateRateLimit(formType) {
        this.lastSubmissions.set(formType, Date.now());
    }

    // Setup global form validation styles
    setupGlobalValidation() {
        if (document.getElementById('form-validation-styles')) return;

        const style = document.createElement('style');
        style.id = 'form-validation-styles';
        style.textContent = `
            .form-field.error,
            input.error,
            textarea.error {
                border-color: #dc3545;
                box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
            }

            .form-field.success,
            input.success,
            textarea.success {
                border-color: #28a745;
                box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
            }

            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes slideOut {
                from {
                    opacity: 1;
                    transform: translateY(0);
                }
                to {
                    opacity: 0;
                    transform: translateY(-10px);
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Public method to validate form
    validateForm(form) {
        if (form.classList.contains('newsletter-form')) {
            const emailInput = form.querySelector('input[type="email"]');
            return this.validateEmail(emailInput.value.trim());
        } else if (form.classList.contains('contact-form')) {
            return this.validateContactForm(form);
        }
        return { isValid: true };
    }

    // Clean up
    destroy() {
        this.submissionInProgress.clear();
        this.lastSubmissions.clear();
        this.isInitialized = false;
    }
}

// Create global instance
const formsManager = new FormsManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        formsManager.init();
    });
} else {
    formsManager.init();
}

// Export for use in other modules
// Make forms manager globally accessible
window.formsManager = formsManager;