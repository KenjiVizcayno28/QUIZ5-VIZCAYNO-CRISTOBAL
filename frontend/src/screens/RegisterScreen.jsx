import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import FormComponent from '../components/FormComponent';
import { clearAuthError, registerUser } from '../store';

const registerFields = [
  {
    name: 'name',
    label: 'Full name',
    placeholder: 'Enter your full name',
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'Enter your email',
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    placeholder: 'Create a password',
  },
  {
    name: 'confirmPassword',
    label: 'Confirm password',
    type: 'password',
    placeholder: 'Re-enter your password',
  },
];

function RegisterScreen() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo, loading, error } = useSelector((state) => state.auth);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (userInfo) {
      navigate('/');
    }
  }, [navigate, userInfo]);

  useEffect(() => {
    return () => {
      dispatch(clearAuthError());
    };
  }, [dispatch]);

  const handleRegister = (formData) => {
    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    setLocalError('');
    dispatch(
      registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      })
    );
  };

  return (
    <FormComponent
      title="Register"
      fields={registerFields}
      submitText="Create account"
      footerText="Already have an account?"
      footerLinkText="Login"
      footerLinkTo="/login"
      loading={loading}
      errorMessage={localError || error}
      onSubmit={handleRegister}
    />
  );
}

export default RegisterScreen;
