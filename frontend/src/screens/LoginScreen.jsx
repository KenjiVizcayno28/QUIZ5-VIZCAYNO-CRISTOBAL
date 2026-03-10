import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import FormComponent from '../components/FormComponent';
import { clearAuthError, loginUser } from '../store';

const loginFields = [
  {
    name: 'username',
    label: 'Username',
    placeholder: 'Enter your username',
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password',
  },
];

function LoginScreen() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo, loading, error } = useSelector((state) => state.auth);

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

  const handleLogin = (formData) => {
    dispatch(loginUser(formData));
  };

  return (
    <FormComponent
      title="Login"
      fields={loginFields}
      submitText="Sign in"
      footerText="Need an account?"
      footerLinkText="Register"
      footerLinkTo="/register"
      loading={loading}
      errorMessage={error}
      onSubmit={handleLogin}
    />
  );
}

export default LoginScreen;
