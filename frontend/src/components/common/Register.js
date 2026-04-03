import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

function Register() {
    const navigate = useNavigate();
    const [regType, setRegType] = useState('user'); // 'user', 'shop', 'provider'
    const [formData, setFormData] = useState({
        name: '', address: '', phone: '', dob: '', age: '', email: '', password: '',
        shopName: '', ownerName: '',
        type: 'nurse', experience: ''
    });
    const [loading, setLoading] = useState(false);

    // State for validation errors
    const [errors, setErrors] = useState({});

    const validateField = (name, value) => {
        let error = "";
        if (name === 'phone') {
            if (!/^\d{0,10}$/.test(value)) return "Only numbers allowed";
            if (value.length > 0 && value.length !== 10) error = "Phone number must be exactly 10 digits";
        }
        if (name === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (value && !emailRegex.test(value)) error = "Invalid email format";
        }
        if (name === 'password') {
            if (value && value.length < 6) error = "Password must be at least 6 characters";
        }
        if (name === 'name' || name === 'shopName' || name === 'ownerName' || name === 'address') {
            if (!value) error = "This field is required";
        }

        setErrors(prev => ({ ...prev, [name]: error }));
        return error;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Blocking input for phone if > 10
        if (name === 'phone' && value.length > 10) return;

        setFormData(prev => ({ ...prev, [name]: value }));
        validateField(name, value);

        if (name === 'dob') {
            const birthDate = new Date(value);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
            setFormData(prev => ({ ...prev, age: age }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        // Final validation check before submit
        let formIsValid = true;
        const newErrors = {};

        const fieldsToValidate = regType === 'user'
            ? ['name', 'email', 'phone', 'dob', 'address', 'password']
            : regType === 'shop'
                ? ['shopName', 'ownerName', 'email', 'phone', 'address', 'password']
                : ['name', 'email', 'phone', 'experience', 'password'];

        fieldsToValidate.forEach(field => {
            const error = validateField(field, formData[field]);
            if (error) {
                newErrors[field] = error;
                formIsValid = false;
            }
        });

        if (!formIsValid) {
            setErrors(newErrors);
            alert("Please fix the errors in the form before submitting.");
            return;
        }

        const url = regType === 'user'
            ? 'http://localhost:5001/health/register'
            : regType === 'shop'
                ? 'http://localhost:5001/health/shop-register'
                : 'http://localhost:5001/health/provider-register';

        setLoading(true);
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, email: formData.email.trim() })
            });
            const data = await response.json();
            if (response.ok) {
                alert(`${regType === 'user' ? 'Registration' : regType === 'shop' ? 'Shop Registration' : 'Provider Registration'} Successful!`);
                navigate('/login');
            } else {
                alert(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="reg-toggle" style={{ display: 'flex', gap: '5px' }}>
                    <button className={regType === 'user' ? 'active' : ''} onClick={() => setRegType('user')}>User</button>
                    <button className={regType === 'shop' ? 'active' : ''} onClick={() => setRegType('shop')}>Shop</button>
                    <button className={regType === 'provider' ? 'active' : ''} onClick={() => setRegType('provider')}>Provider</button>
                </div>
                <h2>{regType === 'user' ? 'Create Account' : regType === 'shop' ? 'Shop Registration' : 'Provider Registration'}</h2>
                <form onSubmit={handleSubmit} noValidate>
                    {regType === 'user' && (
                        <>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" />
                                {errors.name && <span className="error-text">{errors.name}</span>}
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" />
                                {errors.email && <span className="error-text">{errors.email}</span>}
                            </div>
                            <div className="form-group">
                                <label>Phone Number</label>
                                <input type="number" name="phone" value={formData.phone} onChange={handleChange} placeholder="1234567890" />
                                {errors.phone && <span className="error-text">{errors.phone}</span>}
                            </div>
                            <div className="form-group">
                                <label>Date of Birth</label>
                                <input type="date" name="dob" value={formData.dob} onChange={handleChange} />
                                {errors.dob && <span className="error-text">{errors.dob}</span>}
                            </div>
                            <div className="form-group">
                                <label>Age</label>
                                <input type="number" name="age" value={formData.age} readOnly />
                            </div>
                            <div className="form-group">
                                <label>Address</label>
                                <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Enter address"></textarea>
                                {errors.address && <span className="error-text">{errors.address}</span>}
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" />
                                {errors.password && <span className="error-text">{errors.password}</span>}
                            </div>
                        </>
                    )}

                    {regType === 'shop' && (
                        <>
                            <div className="form-group">
                                <label>Shop Name</label>
                                <input type="text" name="shopName" value={formData.shopName} onChange={handleChange} placeholder="Healthy Groceries" />
                                {errors.shopName && <span className="error-text">{errors.shopName}</span>}
                            </div>
                            <div className="form-group">
                                <label>Owner Name</label>
                                <input type="text" name="ownerName" value={formData.ownerName} onChange={handleChange} placeholder="Jane Doe" />
                                {errors.ownerName && <span className="error-text">{errors.ownerName}</span>}
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="shop@example.com" />
                                {errors.email && <span className="error-text">{errors.email}</span>}
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input type="number" name="phone" value={formData.phone} onChange={handleChange} placeholder="1234567890" />
                                {errors.phone && <span className="error-text">{errors.phone}</span>}
                            </div>
                            <div className="form-group">
                                <label>Address</label>
                                <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Shop location"></textarea>
                                {errors.address && <span className="error-text">{errors.address}</span>}
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" />
                                {errors.password && <span className="error-text">{errors.password}</span>}
                            </div>
                        </>
                    )}

                    {regType === 'provider' && (
                        <>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Provider Name" />
                                {errors.name && <span className="error-text">{errors.name}</span>}
                            </div>
                            <div className="form-group">
                                <label>Service Type</label>
                                <select name="type" value={formData.type} onChange={handleChange} className="w-full px-3 py-2 border rounded">
                                    <option value="nurse">Professional Nurse</option>
                                    <option value="homeservice">Home Maintenance / Cleaning</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Years of Experience</label>
                                <input type="number" name="experience" value={formData.experience} onChange={handleChange} placeholder="5" />
                                {errors.experience && <span className="error-text">{errors.experience}</span>}
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="provider@example.com" />
                                {errors.email && <span className="error-text">{errors.email}</span>}
                            </div>
                            <div className="form-group">
                                <label>Phone Number</label>
                                <input type="number" name="phone" value={formData.phone} onChange={handleChange} placeholder="1234567890" />
                                {errors.phone && <span className="error-text">{errors.phone}</span>}
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" />
                                {errors.password && <span className="error-text">{errors.password}</span>}
                            </div>
                        </>
                    )}

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>
                <div className="auth-footer">Already have an account? <Link to="/login">Login here</Link></div>
            </div>
        </div>
    );
}

export default Register;
