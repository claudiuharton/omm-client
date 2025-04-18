import { useState, useCallback, FormEvent, ChangeEvent, FocusEvent } from "react";

/**
 * Validation rules for form fields
 */
export type ValidationRule = {
    required?: boolean;
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    validate?: (value: string) => boolean | string;
};

/**
 * Validation rules for all form fields
 */
export type ValidationRules<T> = {
    [K in keyof T]?: ValidationRule;
};

/**
 * Form errors object type
 */
export type FormErrors<T> = {
    [K in keyof T]?: string;
};

/**
 * Hook for managing form state and validation
 * 
 * @param initialValues - Initial form values
 * @param validationRules - Rules for form validation
 * @param onSubmit - Function to call on form submission
 * @returns Form state, handlers, errors and utility functions
 */
export function useForm<T extends Record<string, any>>(
    initialValues: T,
    validationRules: ValidationRules<T> = {},
    onSubmit?: (values: T) => void | Promise<void>
) {
    const [values, setValues] = useState<T>(initialValues);
    const [errors, setErrors] = useState<FormErrors<T>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    /**
     * Validate a single field
     */
    const validateField = useCallback((name: keyof T, value: any): string | undefined => {
        const rules = validationRules[name];
        if (!rules) return undefined;

        if (rules.required && (value === '' || value === null || value === undefined)) {
            return 'This field is required';
        }

        if (rules.pattern && !rules.pattern.test(value)) {
            return 'Invalid format';
        }

        if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
            return `Must be at least ${rules.minLength} characters`;
        }

        if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
            return `Must be at most ${rules.maxLength} characters`;
        }

        if (rules.validate) {
            const result = rules.validate(value);
            if (typeof result === 'string') {
                return result;
            } else if (!result) {
                return 'Invalid value';
            }
        }

        return undefined;
    }, [validationRules]);

    /**
     * Validate all form fields
     */
    const validateForm = useCallback((): boolean => {
        const newErrors: FormErrors<T> = {};
        let isValid = true;

        for (const key in validationRules) {
            const error = validateField(key as keyof T, values[key as keyof T]);
            if (error) {
                newErrors[key as keyof T] = error;
                isValid = false;
            }
        }

        setErrors(newErrors);
        return isValid;
    }, [validateField, validationRules, values]);

    /**
     * Handle input change
     */
    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const newValue = type === 'checkbox'
            ? (e.target as HTMLInputElement).checked
            : value;

        setValues(prev => ({ ...prev, [name]: newValue }));

        // Validate field when value changes if it has been touched
        if (touched[name]) {
            const error = validateField(name as keyof T, newValue);
            setErrors(prev => ({ ...prev, [name]: error }));
        }
    }, [touched, validateField]);

    /**
     * Handle blur event to mark a field as touched
     */
    const handleBlur = useCallback((e: FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name } = e.target;

        setTouched(prev => ({ ...prev, [name]: true }));

        // Validate field on blur
        const error = validateField(name as keyof T, values[name as keyof T]);
        setErrors(prev => ({ ...prev, [name]: error }));
    }, [validateField, values]);

    /**
     * Handle form submission
     */
    const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Mark all fields as touched
        const allTouched = Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {});
        setTouched(allTouched);

        // Validate form
        const isValid = validateForm();
        if (!isValid) return;

        if (onSubmit) {
            try {
                setIsSubmitting(true);
                await onSubmit(values);
            } catch (error) {
                console.error('Form submission error:', error);
            } finally {
                setIsSubmitting(false);
            }
        }
    }, [validateForm, onSubmit, values]);

    /**
     * Reset form to initial values
     */
    const resetForm = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
        setIsSubmitting(false);
    }, [initialValues]);

    /**
     * Set form values programmatically
     */
    const setFieldValue = useCallback((name: keyof T, value: any) => {
        setValues(prev => ({ ...prev, [name]: value }));
    }, []);

    /**
     * Set multiple form values programmatically
     */
    const setMultipleValues = useCallback((newValues: Partial<T>) => {
        setValues(prev => ({ ...prev, ...newValues }));
    }, []);

    return {
        values,
        errors,
        touched,
        isSubmitting,
        handleChange,
        handleBlur,
        handleSubmit,
        resetForm,
        setFieldValue,
        setMultipleValues,
        validateForm
    };
} 