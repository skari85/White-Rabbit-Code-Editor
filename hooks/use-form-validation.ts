'use client';

import { useState, useCallback, useMemo } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  message?: string;
}

export interface FieldValidation {
  [fieldName: string]: ValidationRule[];
}

export interface ValidationErrors {
  [fieldName: string]: string[];
}

export interface UseFormValidationOptions<T> {
  initialValues: T;
  validationRules: FieldValidation;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export function useFormValidation<T extends Record<string, any>>({
  initialValues,
  validationRules,
  validateOnChange = false,
  validateOnBlur = true
}: UseFormValidationOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback((fieldName: string, value: any): string[] => {
    const rules = validationRules[fieldName] || [];
    const fieldErrors: string[] = [];

    for (const rule of rules) {
      // Required validation
      if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        fieldErrors.push(rule.message || `${fieldName} is required`);
        continue;
      }

      // Skip other validations if field is empty and not required
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        continue;
      }

      // Min length validation
      if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
        fieldErrors.push(rule.message || `${fieldName} must be at least ${rule.minLength} characters`);
      }

      // Max length validation
      if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
        fieldErrors.push(rule.message || `${fieldName} must be no more than ${rule.maxLength} characters`);
      }

      // Pattern validation
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        fieldErrors.push(rule.message || `${fieldName} format is invalid`);
      }

      // Custom validation
      if (rule.custom) {
        const customError = rule.custom(value);
        if (customError) {
          fieldErrors.push(customError);
        }
      }
    }

    return fieldErrors;
  }, [validationRules]);

  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(fieldName => {
      const fieldErrors = validateField(fieldName, values[fieldName]);
      if (fieldErrors.length > 0) {
        newErrors[fieldName] = fieldErrors;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validateField, validationRules]);

  const setValue = useCallback((fieldName: string, value: any) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));

    if (validateOnChange) {
      const fieldErrors = validateField(fieldName, value);
      setErrors(prev => ({
        ...prev,
        [fieldName]: fieldErrors
      }));
    }
  }, [validateField, validateOnChange]);

  const setFieldTouched = useCallback((fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));

    if (validateOnBlur) {
      const fieldErrors = validateField(fieldName, values[fieldName]);
      setErrors(prev => ({
        ...prev,
        [fieldName]: fieldErrors
      }));
    }
  }, [validateField, validateOnBlur, values]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const getFieldProps = useCallback((fieldName: string) => ({
    value: values[fieldName] || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValue(fieldName, e.target.value);
    },
    onBlur: () => setFieldTouched(fieldName),
    error: touched[fieldName] && errors[fieldName]?.[0],
    hasError: touched[fieldName] && (errors[fieldName]?.length || 0) > 0
  }), [values, errors, touched, setValue, setFieldTouched]);

  const isValid = useMemo(() => {
    return Object.keys(errors).every(key => errors[key].length === 0);
  }, [errors]);

  const hasErrors = useMemo(() => {
    return Object.keys(errors).some(key => errors[key].length > 0);
  }, [errors]);

  return {
    values,
    errors,
    touched,
    isValid,
    hasErrors,
    setValue,
    setFieldTouched,
    validateForm,
    validateField,
    resetForm,
    getFieldProps
  };
}

// Common validation rules
export const commonValidationRules = {
  required: (message?: string): ValidationRule => ({
    required: true,
    message: message || 'This field is required'
  }),

  email: (message?: string): ValidationRule => ({
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: message || 'Please enter a valid email address'
  }),

  minLength: (length: number, message?: string): ValidationRule => ({
    minLength: length,
    message: message || `Must be at least ${length} characters`
  }),

  maxLength: (length: number, message?: string): ValidationRule => ({
    maxLength: length,
    message: message || `Must be no more than ${length} characters`
  }),

  url: (message?: string): ValidationRule => ({
    pattern: /^https?:\/\/.+/,
    message: message || 'Please enter a valid URL'
  }),

  apiKey: (message?: string): ValidationRule => ({
    pattern: /^[a-zA-Z0-9_-]+$/,
    minLength: 10,
    message: message || 'Please enter a valid API key'
  }),

  fileName: (message?: string): ValidationRule => ({
    pattern: /^[^<>:"/\\|?*]+$/,
    message: message || 'File name contains invalid characters'
  }),

  custom: (validator: (value: any) => string | null): ValidationRule => ({
    custom: validator
  })
};

// Validation for specific use cases
export const aiSettingsValidation: FieldValidation = {
  apiKey: [
    commonValidationRules.required('API key is required'),
    commonValidationRules.minLength(10, 'API key must be at least 10 characters')
  ],
  model: [
    commonValidationRules.required('Model selection is required')
  ],
  temperature: [
    commonValidationRules.custom((value) => {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0 || num > 2) {
        return 'Temperature must be between 0 and 2';
      }
      return null;
    })
  ],
  maxTokens: [
    commonValidationRules.custom((value) => {
      const num = parseInt(value);
      if (isNaN(num) || num < 1 || num > 8000) {
        return 'Max tokens must be between 1 and 8000';
      }
      return null;
    })
  ]
};

export const fileValidation: FieldValidation = {
  fileName: [
    commonValidationRules.required('File name is required'),
    commonValidationRules.fileName(),
    commonValidationRules.maxLength(255, 'File name is too long')
  ]
};

export const projectValidation: FieldValidation = {
  projectName: [
    commonValidationRules.required('Project name is required'),
    commonValidationRules.minLength(2, 'Project name must be at least 2 characters'),
    commonValidationRules.maxLength(50, 'Project name is too long')
  ],
  description: [
    commonValidationRules.maxLength(200, 'Description is too long')
  ]
};
