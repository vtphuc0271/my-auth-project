// src/hooks/useForm.js
import { useState } from 'react';

const useForm = (initialValues, validate, onSubmit) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues({ ...values, [name]: value });
    const validationErrors = validate({ ...values, [name]: value });
    setErrors(validationErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setLoading(true);
      setServerError(null);
      try {
        await onSubmit(values); // Gọi onSubmit từ tham số
      } catch (err) {
        setServerError(err.response?.data?.message || 'Có lỗi xảy ra');
      } finally {
        setLoading(false);
      }
    }
  };

  return {
    values,
    errors,
    serverError,
    loading,
    handleChange,
    handleSubmit,
  };
};

export default useForm;