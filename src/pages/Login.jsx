import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff, FiMail, FiLock, FiSmartphone } from 'react-icons/fi';
import { authAPI } from '../services/api';
import '../styles/Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    emailOrMobile: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setFormData({ emailOrMobile: savedEmail, password: '' });
      setRememberMe(true);
    } else {
      setFormData({ emailOrMobile: '', password: '' });
    }
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.emailOrMobile.trim()) {
      newErrors.emailOrMobile = 'Email or Mobile number is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await authAPI.login({
        emailOrMobile: formData.emailOrMobile,
        password: formData.password,
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify({
          fullName: response.data.fullName,
          userId: response.data.userId,
          role: response.data.role,
          email: formData.emailOrMobile.includes('@') ? formData.emailOrMobile : '',
          mobile: !formData.emailOrMobile.includes('@') ? formData.emailOrMobile : '',
        }));

        if (rememberMe) {
          localStorage.setItem('rememberedEmail', formData.emailOrMobile);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        window.dispatchEvent(new Event('auth:updated'));

        setMessage({ type: 'success', text: 'Login successful! Redirecting...' });
        setTimeout(() => navigate('/'), 600);
      } else {
        setMessage({ type: 'error', text: response.data.message });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid Email/Mobile Number or Password';
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const isEmail = formData.emailOrMobile.includes('@');

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-form-wrapper">
          <div className="login-header">
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-subtitle">Sign in to your FurniHub account</p>
          </div>

          {message.text && (
            <div className={`message message-${message.type}`}>{message.text}</div>
          )}

          <form onSubmit={handleSubmit} noValidate autoComplete="off">
            <div className="form-group">
              <label>Email or Mobile Number</label>
              <div className="input-wrapper">
                {isEmail ? <FiMail className="input-icon" /> : <FiSmartphone className="input-icon" />}
                <input
                  type="text"
                  name="emailOrMobile"
                  placeholder="Enter your email or mobile number"
                  value={formData.emailOrMobile}
                  onChange={handleChange}
                  autoComplete="off"
                  className={errors.emailOrMobile ? 'error' : ''}
                />
              </div>
              {errors.emailOrMobile && <span className="error-text">{errors.emailOrMobile}</span>}
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <FiLock className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className={errors.password ? 'error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="form-footer">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="form-link">Forgot Password?</Link>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? <span className="loading-spinner" /> : 'Sign In'}
            </button>
          </form>

          <div className="login-footer">
            <p>Don't have an account? <Link to="/register" className="form-link">Create Account</Link></p>
          </div>
        </div>
        <div className="login-image">
          <div className="login-image-content">
            <h2>Your Home Deserves the Best</h2>
            <p>Sign in to explore our curated collection of premium furniture</p>
            <div className="login-testimonial">
              <p>"FurniHub transformed my home with their beautiful furniture pieces. Highly recommended!"</p>
              <span>- Sarah J.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
