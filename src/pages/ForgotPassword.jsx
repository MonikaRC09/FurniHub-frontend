import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiSmartphone, FiKey, FiCheck, FiArrowLeft } from 'react-icons/fi';
import { authAPI } from '../services/api';
import '../styles/ForgotPassword.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    emailOrMobile: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!formData.emailOrMobile.trim()) {
      setErrors({ emailOrMobile: 'Email or Mobile number is required' });
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.forgotPassword({
        emailOrMobile: formData.emailOrMobile,
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: response.data.message });
        setStep(2);
      } else {
        setMessage({ type: 'error', text: response.data.message });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send OTP';
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!formData.otp.trim()) {
      setErrors({ otp: 'Please enter the OTP' });
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.verifyOtp({
        emailOrMobile: formData.emailOrMobile,
        otp: formData.otp,
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'OTP verified! Set your new password.' });
        setStep(3);
      } else {
        setMessage({ type: 'error', text: response.data.message });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid OTP';
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    const newErrors = {};
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password does not meet requirements';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const response = await authAPI.resetPassword({
        emailOrMobile: formData.emailOrMobile,
        otp: formData.otp,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Password reset successful! Redirecting to login...' });
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setMessage({ type: 'error', text: response.data.message });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password';
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-page">
      <div className="forgot-container">
        <Link to="/login" className="back-link"><FiArrowLeft /> Back to Login</Link>

        <div className="forgot-header">
          {step === 1 && <FiKey className="forgot-icon" />}
          {step === 2 && <FiMail className="forgot-icon" />}
          {step === 3 && <FiCheck className="forgot-icon" />}
          <h1 className="forgot-title">
            {step === 1 && 'Forgot Password'}
            {step === 2 && 'Verify OTP'}
            {step === 3 && 'Reset Password'}
          </h1>
          <p className="forgot-subtitle">
            {step === 1 && 'Enter your registered email or mobile number to receive an OTP'}
            {step === 2 && `Enter the OTP sent to ${formData.emailOrMobile}`}
            {step === 3 && 'Create a new strong password for your account'}
          </p>
        </div>

        <div className="step-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}><span>1</span></div>
          <div className="step-line" />
          <div className={`step ${step >= 2 ? 'active' : ''}`}><span>2</span></div>
          <div className="step-line" />
          <div className={`step ${step >= 3 ? 'active' : ''}`}><span>3</span></div>
        </div>

        {message.text && (
          <div className={`message message-${message.type}`}>{message.text}</div>
        )}

        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label>Email or Mobile Number</label>
              <div className="input-wrapper">
                <FiSmartphone className="input-icon" />
                <input
                  type="text"
                  name="emailOrMobile"
                  placeholder="Enter your email or mobile number"
                  value={formData.emailOrMobile}
                  onChange={handleChange}
                  className={errors.emailOrMobile ? 'error' : ''}
                />
              </div>
              {errors.emailOrMobile && <span className="error-text">{errors.emailOrMobile}</span>}
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? <span className="loading-spinner" /> : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label>Enter OTP</label>
              <div className="input-wrapper">
                <FiKey className="input-icon" />
                <input
                  type="text"
                  name="otp"
                  placeholder="Enter 6-digit OTP"
                  value={formData.otp}
                  onChange={handleChange}
                  maxLength={6}
                  className={errors.otp ? 'error' : ''}
                />
              </div>
              {errors.otp && <span className="error-text">{errors.otp}</span>}
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? <span className="loading-spinner" /> : 'Verify OTP'}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-block"
              onClick={() => { setStep(1); setMessage({ type: '', text: '' }); }}
            >
              Change Email/Mobile
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label>New Password</label>
              <div className="input-wrapper">
                <FiKey className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="newPassword"
                  placeholder="Enter new password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className={errors.newPassword ? 'error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiMail /> : <FiKey />}
                </button>
              </div>
              {errors.newPassword && <span className="error-text">{errors.newPassword}</span>}
              {formData.newPassword && (
                <div className="password-strength">
                  <div className={`strength-bar ${
                    formData.newPassword.length >= 8 ? 'strength-strong' : 'strength-weak'
                  }`} />
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <div className="input-wrapper">
                <FiCheck className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? 'error' : ''}
                />
              </div>
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? <span className="loading-spinner" /> : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
