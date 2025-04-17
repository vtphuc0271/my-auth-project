// src/hooks/useForm.js
import { useState, useCallback } from "react";

const useForm = (initialValues, validate, onSubmit) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Xử lý thay đổi input
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;

    // Lấy giá trị dựa trên type của input
    const newValue = type === 'checkbox' ? checked : value;

    setValues((prev) => {
      const newValues = { ...prev, [name]: newValue };
      setErrors(validate(newValues));
      return newValues;
    });
  }, [validate]);

  // Tùy chọn: kiểm tra lỗi khi rời khỏi input
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    const fieldErrors = validate(values);
    setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] }));
  }, [validate, values]);

  // Xử lý submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setLoading(true);
      setServerError(null);
      try {
        await onSubmit(values);
      } catch (err) {
        const message =
          err.response?.data?.message || err.message || "Có lỗi xảy ra";
        setServerError(message);
      } finally {
        setLoading(false);
      }
    }
  };

  return {
    values,
    errors,
    loading,
    serverError,
    handleChange,
    handleBlur,
    handleSubmit,
    setValues,
    setErrors,
  };
};

export default useForm;