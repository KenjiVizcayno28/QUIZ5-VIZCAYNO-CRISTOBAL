import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Loader from './Loader';
import Message from './Message';
import '../styles/ui.css';

function FormComponent({
  title,
  fields,
  submitText,
  footerText,
  footerLinkText,
  footerLinkTo,
  onSubmit,
  loading,
  errorMessage,
}) {
  const initialFormData = useMemo(() => {
    return fields.reduce((acc, field) => {
      acc[field.name] = '';
      return acc;
    }, {});
  }, [fields]);

  const [formData, setFormData] = useState(initialFormData);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const submitHandler = (event) => {
    event.preventDefault();
    onSubmit(formData, () => setFormData(initialFormData));
  };

  return (
    <div className="auth-screen-wrap">
      <form className="auth-card" onSubmit={submitHandler}>
        <h1>{title}</h1>

        <Message type="error">{errorMessage}</Message>

        {fields.map((field) => (
          <label key={field.name} className="auth-field">
            <span>{field.label}</span>
            <input
              type={field.type || 'text'}
              name={field.name}
              value={formData[field.name]}
              onChange={handleChange}
              placeholder={field.placeholder || ''}
              required={field.required !== false}
            />
          </label>
        ))}

        <button type="submit" disabled={loading} className="auth-submit">
          {loading ? <Loader /> : submitText}
        </button>

        <p className="auth-footer">
          {footerText} <Link to={footerLinkTo}>{footerLinkText}</Link>
        </p>
      </form>
    </div>
  );
}

export default FormComponent;
