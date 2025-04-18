import React, { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '../stores/auth/auth.store';
import { RegisterMechanic } from '../interfaces';

const RegisterMechanicPage: React.FC = () => {
    const navigate = useNavigate();
    const { registerMechanic } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<RegisterMechanic>({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        specialization: '',
        experience: '',
        certifications: []
    });

    const [errors, setErrors] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        specialization: '',
    });

    const specializations = [
        'General Mechanic',
        'Engine Specialist',
        'Transmission Specialist',
        'Brake Specialist',
        'Electrical Systems',
        'Auto Body Repair',
        'HVAC Specialist',
        'Tire Technician',
        'Diagnostics Expert',
        'Performance Tuning'
    ];

    const certificationOptions = [
        'ASE Certified',
        'Manufacturer Certified',
        'EPA Certified',
        'I-CAR Certified',
        'State Inspection License',
        'Mobile Electronics Certified Professional',
        'Automotive AC Certification',
        'Hybrid/EV Certification'
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });

        // Clear error when user types
        if (errors[name as keyof typeof errors]) {
            setErrors({
                ...errors,
                [name]: ''
            });
        }
    };

    const handleCertificationsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const options = e.target.options;
        const selectedValues: string[] = [];

        for (let i = 0; i < options.length; i++) {
            if (options[i].selected) {
                selectedValues.push(options[i].value);
            }
        }

        setFormData({
            ...formData,
            certifications: selectedValues
        });
    };

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const validateForm = () => {
        const newErrors = {
            firstName: !formData.firstName ? 'First name is required' : '',
            lastName: !formData.lastName ? 'Last name is required' : '',
            email: !formData.email
                ? 'Email is required'
                : !/\S+@\S+\.\S+/.test(formData.email)
                    ? 'Email format is invalid'
                    : '',
            password: !formData.password
                ? 'Password is required'
                : formData.password.length < 6
                    ? 'Password must be at least 6 characters'
                    : '',
            phone: !formData.phone
                ? 'Phone number is required'
                : !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))
                    ? 'Phone number format is invalid'
                    : '',
            specialization: !formData.specialization ? 'Specialization is required' : '',
        };

        setErrors(newErrors);
        return !Object.values(newErrors).some(error => error);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        try {
            await registerMechanic(formData);
            toast.success('Registration successful! Please log in to access your dashboard.');
            navigate('/auth');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <h2 className="text-xl md:text-2xl font-bold leading-tight mt-8 text-gray-600 uppercase">
                Register as a Mechanic
            </h2>
            <p className="text-gray-500 mb-6">
                Join our network of professional mobile mechanics
            </p>

            <form className="mt-4" onSubmit={handleSubmit}>
                {/* Personal Information Section */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Personal Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-700">First Name*</label>
                            <input
                                type="text"
                                name="firstName"
                                placeholder="Your first name"
                                className="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border focus:border-blue-500 focus:bg-white focus:outline-none"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                            />
                            {errors.firstName && (
                                <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-gray-700">Last Name*</label>
                            <input
                                type="text"
                                name="lastName"
                                placeholder="Your last name"
                                className="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border focus:border-blue-500 focus:bg-white focus:outline-none"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                            />
                            {errors.lastName && (
                                <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                            )}
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="block text-gray-700">Email*</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="email@example.com"
                            className="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border focus:border-blue-500 focus:bg-white focus:outline-none"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                        {errors.email && (
                            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                        )}
                    </div>

                    <div className="mt-4">
                        <label className="block text-gray-700">Phone Number*</label>
                        <input
                            type="tel"
                            name="phone"
                            placeholder="e.g., 123-456-7890"
                            className="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border focus:border-blue-500 focus:bg-white focus:outline-none"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                        />
                        {errors.phone && (
                            <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                        )}
                    </div>

                    <div className="mt-4 relative">
                        <label className="block text-gray-700">Password*</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                placeholder="Create a secure password"
                                className="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border focus:border-blue-500 focus:bg-white focus:outline-none pr-10"
                                value={formData.password}
                                onChange={handleChange}
                                minLength={6}
                                required
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 mt-2 flex items-center text-sm leading-5"
                                onClick={toggleShowPassword}
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                    </div>
                </div>

                {/* Professional Information Section */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Professional Information</h3>

                    <div className="mt-4">
                        <label className="block text-gray-700">Specialization*</label>
                        <select
                            name="specialization"
                            className="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border focus:border-blue-500 focus:bg-white focus:outline-none"
                            value={formData.specialization}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select your main specialization</option>
                            {specializations.map((specialization) => (
                                <option key={specialization} value={specialization}>
                                    {specialization}
                                </option>
                            ))}
                        </select>
                        {errors.specialization && (
                            <p className="text-red-500 text-xs mt-1">{errors.specialization}</p>
                        )}
                    </div>

                    <div className="mt-4">
                        <label className="block text-gray-700">Years of Experience</label>
                        <input
                            type="number"
                            name="experience"
                            placeholder="Years of experience"
                            className="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border focus:border-blue-500 focus:bg-white focus:outline-none"
                            value={formData.experience}
                            onChange={handleChange}
                            min="0"
                        />
                    </div>

                    <div className="mt-4">
                        <label className="block text-gray-700">Certifications</label>
                        <select
                            name="certifications"
                            multiple
                            className="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border focus:border-blue-500 focus:bg-white focus:outline-none h-32"
                            value={formData.certifications as string[]}
                            onChange={handleCertificationsChange}
                        >
                            {certificationOptions.map((certification) => (
                                <option key={certification} value={certification}>
                                    {certification}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Hold Ctrl (or Cmd) to select multiple options</p>
                    </div>
                </div>

                <div className="mt-6">
                    <p className="text-sm text-gray-500">
                        Already have an account?{" "}
                        <Link to="/auth" className="text-indigo-600 hover:underline">
                            Log in here
                        </Link>
                    </p>
                </div>

                <div className="flex justify-between items-center mt-6">
                    <button
                        type="button"
                        onClick={() => navigate('/auth')}
                        className="px-4 py-2 text-indigo-600 border border-indigo-600 rounded hover:bg-indigo-50"
                    >
                        Back to Login
                    </button>

                    <button
                        type="submit"
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Registering...' : 'Register as Mechanic'}
                    </button>
                </div>
            </form>
        </>
    );
};

export default RegisterMechanicPage; 