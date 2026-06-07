/**
 * Signup Page — /signup
 * Production-ready TypeScript React component
 *
 * Features:
 * - Full client-side validation with field-level error messages
 * - Async form submission with loading + error states
 * - CSRF-token support (reads from meta tag or cookie)
 * - Accessible: aria-describedby, aria-invalid, focus management
 * - Password strength meter
 * - Show/hide password toggle
 * - Rate-limit aware (handles 429 from API)
 */

import React, {
  ChangeEvent,
  FormEvent,
  useCallback,
  useId,
  useReducer,
  useRef,
  useState,
} from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SignupPayload {
  fullName: string;
  email: string;
  password: string;
}

interface SignupSuccessResponse {
  userId: string;
  email: string;
  redirectUrl?: string;
}

interface ApiErrorResponse {
  message: string;
  field?: keyof FormFields;
  code?: string;
}

// ─── Form State ──────────────────────────────────────────────────────────────

interface FormFields {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

interface FieldErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  agreeToTerms?: string;
}

interface FormState {
  fields: FormFields;
  errors: FieldErrors;
  touched: Partial<Record<keyof FormFields, boolean>>;
  isSubmitting: boolean;
  submitError: string | null;
  submitSuccess: boolean;
}

type FormAction =
  | { type: "FIELD_CHANGE"; field: keyof FormFields; value: string | boolean }
  | { type: "FIELD_BLUR"; field: keyof FormFields }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS" }
  | { type: "SUBMIT_ERROR"; message: string; field?: keyof FormFields }
  | { type: "RESET" };

const initialFields: FormFields = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  agreeToTerms: false,
};

const initialState: FormState = {
  fields: initialFields,
  errors: {},
  touched: {},
  isSubmitting: false,
  submitError: null,
  submitSuccess: false,
};

// ─── Validation ──────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_MIN_LENGTH = 8;

function validateField(
  field: keyof FormFields,
  value: string | boolean,
  allFields: FormFields
): string | undefined {
  switch (field) {
    case "fullName": {
      const v = (value as string).trim();
      if (!v) return "Full name is required.";
      if (v.length < 2) return "Name must be at least 2 characters.";
      if (v.length > 100) return "Name must be 100 characters or fewer.";
      return undefined;
    }
    case "email": {
      const v = (value as string).trim();
      if (!v) return "Email address is required.";
      if (!EMAIL_RE.test(v)) return "Enter a valid email address.";
      return undefined;
    }
    case "password": {
      const v = value as string;
      if (!v) return "Password is required.";
      if (v.length < PASSWORD_MIN_LENGTH)
        return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
      if (!/[A-Z]/.test(v)) return "Include at least one uppercase letter.";
      if (!/[0-9]/.test(v)) return "Include at least one number.";
      return undefined;
    }
    case "confirmPassword": {
      const v = value as string;
      if (!v) return "Please confirm your password.";
      if (v !== allFields.password) return "Passwords do not match.";
      return undefined;
    }
    case "agreeToTerms": {
      if (!value) return "You must agree to the Terms of Service.";
      return undefined;
    }
    default:
      return undefined;
  }
}

function validateAll(fields: FormFields): FieldErrors {
  const errors: FieldErrors = {};
  (Object.keys(fields) as Array<keyof FormFields>).forEach((key) => {
    const err = validateField(key, fields[key], fields);
    if (err) (errors as Record<string, string>)[key] = err;
  });
  return errors;
}

// ─── Password Strength ───────────────────────────────────────────────────────

interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
}

function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: "", color: "#e5e7eb" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const clamped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;

  const map: Record<
    0 | 1 | 2 | 3 | 4,
    { label: string; color: string }
  > = {
    0: { label: "", color: "#e5e7eb" },
    1: { label: "Weak", color: "#ef4444" },
    2: { label: "Fair", color: "#f59e0b" },
    3: { label: "Good", color: "#3b82f6" },
    4: { label: "Strong", color: "#22c55e" },
  };

  return { score: clamped, ...map[clamped] };
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "FIELD_CHANGE": {
      const fields = { ...state.fields, [action.field]: action.value };
      const errors = { ...state.errors };
      if (state.touched[action.field]) {
        const err = validateField(action.field, action.value, fields);
        if (err) errors[action.field] = err;
        else delete errors[action.field];

        // Re-validate confirmPassword when password changes
        if (action.field === "password" && state.touched.confirmPassword) {
          const cpErr = validateField(
            "confirmPassword",
            fields.confirmPassword,
            fields
          );
          if (cpErr) errors.confirmPassword = cpErr;
          else delete errors.confirmPassword;
        }
      }
      return { ...state, fields, errors, submitError: null };
    }
    case "FIELD_BLUR": {
      const err = validateField(
        action.field,
        state.fields[action.field],
        state.fields
      );
      const errors = { ...state.errors };
      if (err) errors[action.field] = err;
      else delete errors[action.field];
      return {
        ...state,
        errors,
        touched: { ...state.touched, [action.field]: true },
      };
    }
    case "SUBMIT_START":
      return {
        ...state,
        isSubmitting: true,
        submitError: null,
        errors: validateAll(state.fields),
      };
    case "SUBMIT_SUCCESS":
      return { ...state, isSubmitting: false, submitSuccess: true };
    case "SUBMIT_ERROR": {
      const errors = { ...state.errors };
      if (action.field) errors[action.field] = action.message;
      return {
        ...state,
        isSubmitting: false,
        submitError: action.field ? null : action.message,
        errors,
      };
    }
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

// ─── CSRF Helper ─────────────────────────────────────────────────────────────

function getCsrfToken(): string | null {
  // 1. Check <meta name="csrf-token"> (Rails / Django convention)
  const meta = document.querySelector<HTMLMetaElement>(
    'meta[name="csrf-token"]'
  );
  if (meta?.content) return meta.content;

  // 2. Check cookies for 'csrftoken' (Django REST) or 'XSRF-TOKEN' (Angular/Laravel)
  const cookieMap = Object.fromEntries(
    document.cookie.split(";").map((c) => {
      const [k, ...rest] = c.trim().split("=");
      return [k, decodeURIComponent(rest.join("="))];
    })
  );
  return cookieMap["XSRF-TOKEN"] ?? cookieMap["csrftoken"] ?? null;
}

// ─── API Call ────────────────────────────────────────────────────────────────

async function submitSignup(
  payload: SignupPayload,
  signal: AbortSignal
): Promise<SignupSuccessResponse> {
  const csrfToken = getCsrfToken();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (csrfToken) headers["X-CSRFToken"] = csrfToken;

  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers,
    credentials: "include",
    signal,
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    return response.json() as Promise<SignupSuccessResponse>;
  }

  if (response.status === 429) {
    throw Object.assign(new Error("Too many requests. Please wait a moment."), {
      code: "RATE_LIMITED",
    });
  }

  let apiError: ApiErrorResponse;
  try {
    apiError = (await response.json()) as ApiErrorResponse;
  } catch {
    throw new Error(`Unexpected error (${response.status}). Please try again.`);
  }

  const err = Object.assign(new Error(apiError.message), {
    field: apiError.field,
    code: apiError.code,
  });
  throw err;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface InputFieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  autoComplete?: string;
  error?: string;
  disabled?: boolean;
  rightSlot?: React.ReactNode;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
}

const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  type,
  value,
  autoComplete,
  error,
  disabled,
  rightSlot,
  onChange,
  onBlur,
}) => {
  const errorId = `${id}-error`;
  return (
    <div className="field-group">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="input-wrapper">
        <input
          id={id}
          type={type}
          value={value}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={`field-input ${error ? "field-input--error" : ""}`}
          onChange={onChange}
          onBlur={onBlur}
        />
        {rightSlot && <div className="input-right-slot">{rightSlot}</div>}
      </div>
      {error && (
        <p id={errorId} role="alert" className="field-error">
          {error}
        </p>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const SignupPage: React.FC = () => {
  const [state, dispatch] = useReducer(formReducer, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;

  const { fields, errors, isSubmitting, submitError, submitSuccess } = state;
  const strength = getPasswordStrength(fields.password);

  const handleChange = useCallback(
    (field: keyof FormFields) =>
      (e: ChangeEvent<HTMLInputElement>) => {
        const value =
          e.target.type === "checkbox" ? e.target.checked : e.target.value;
        dispatch({ type: "FIELD_CHANGE", field, value });
      },
    []
  );

  const handleBlur = useCallback(
    (field: keyof FormFields) => () => {
      dispatch({ type: "FIELD_BLUR", field });
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const allErrors = validateAll(fields);
      dispatch({ type: "SUBMIT_START" });

      if (Object.keys(allErrors).length > 0) {
        // Focus first errored field
        const firstKey = Object.keys(allErrors)[0];
        document.getElementById(id(firstKey))?.focus();
        dispatch({
          type: "SUBMIT_ERROR",
          message: "Please fix the errors above.",
        });
        return;
      }

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      try {
        const result = await submitSignup(
          {
            fullName: fields.fullName.trim(),
            email: fields.email.trim().toLowerCase(),
            password: fields.password,
          },
          abortRef.current.signal
        );

        dispatch({ type: "SUBMIT_SUCCESS" });

        if (result.redirectUrl) {
          window.location.href = result.redirectUrl;
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;

        const apiErr = err as Error & {
          field?: keyof FormFields;
          code?: string;
        };
        dispatch({
          type: "SUBMIT_ERROR",
          message: apiErr.message ?? "Something went wrong. Please try again.",
          field: apiErr.field,
        });

        if (apiErr.field) {
          document.getElementById(id(apiErr.field))?.focus();
        }
      }
    },
    [fields, id]
  );

  // ─── Success Screen ───────────────────────────────────────────────────────

  if (submitSuccess) {
    return (
      <main className="page-root" aria-label="Signup confirmation">
        <div className="card card--narrow">
          <div className="success-icon" aria-hidden="true">✓</div>
          <h1 className="card-title">Account created</h1>
          <p className="card-subtitle">
            Welcome! Check your inbox for a verification email.
          </p>
        </div>
      </main>
    );
  }

  // ─── Signup Form ──────────────────────────────────────────────────────────

  return (
    <main className="page-root" aria-label="Create account">
      <div className="card">
        <header className="card-header">
          <div className="logo" aria-hidden="true">◈</div>
          <h1 className="card-title">Create your account</h1>
          <p className="card-subtitle">
            Already have an account?{" "}
            <a href="/login" className="link">
              Sign in
            </a>
          </p>
        </header>

        {submitError && (
          <div role="alert" className="alert alert--error">
            {submitError}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          noValidate
          aria-label="Signup form"
          className="form"
        >
          <InputField
            id={id("fullName")}
            label="Full name"
            type="text"
            value={fields.fullName}
            autoComplete="name"
            error={errors.fullName}
            disabled={isSubmitting}
            onChange={handleChange("fullName")}
            onBlur={handleBlur("fullName")}
          />

          <InputField
            id={id("email")}
            label="Email address"
            type="email"
            value={fields.email}
            autoComplete="email"
            error={errors.email}
            disabled={isSubmitting}
            onChange={handleChange("email")}
            onBlur={handleBlur("email")}
          />

          <InputField
            id={id("password")}
            label="Password"
            type={showPassword ? "text" : "password"}
            value={fields.password}
            autoComplete="new-password"
            error={errors.password}
            disabled={isSubmitting}
            onChange={handleChange("password")}
            onBlur={handleBlur("password")}
            rightSlot={
              <button
                type="button"
                className="toggle-btn"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            }
          />

          {fields.password && (
            <div className="strength-meter" aria-live="polite">
              <div className="strength-track">
                {([1, 2, 3, 4] as const).map((level) => (
                  <div
                    key={level}
                    className="strength-bar"
                    style={{
                      background:
                        strength.score >= level ? strength.color : undefined,
                    }}
                  />
                ))}
              </div>
              {strength.label && (
                <span
                  className="strength-label"
                  style={{ color: strength.color }}
                >
                  {strength.label}
                </span>
              )}
            </div>
          )}

          <InputField
            id={id("confirmPassword")}
            label="Confirm password"
            type={showConfirmPassword ? "text" : "password"}
            value={fields.confirmPassword}
            autoComplete="new-password"
            error={errors.confirmPassword}
            disabled={isSubmitting}
            onChange={handleChange("confirmPassword")}
            onBlur={handleBlur("confirmPassword")}
            rightSlot={
              <button
                type="button"
                className="toggle-btn"
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            }
          />

          <div className="field-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={fields.agreeToTerms}
                disabled={isSubmitting}
                aria-invalid={!!errors.agreeToTerms}
                aria-describedby={
                  errors.agreeToTerms ? id("agreeToTerms-error") : undefined
                }
                onChange={handleChange("agreeToTerms")}
                onBlur={handleBlur("agreeToTerms")}
                className="checkbox-input"
              />
              <span>
                I agree to the{" "}
                <a href="/terms" className="link" target="_blank" rel="noreferrer">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" className="link" target="_blank" rel="noreferrer">
                  Privacy Policy
                </a>
              </span>
            </label>
            {errors.agreeToTerms && (
              <p
                id={id("agreeToTerms-error")}
                role="alert"
                className="field-error"
              >
                {errors.agreeToTerms}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="submit-btn"
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" aria-hidden="true" /> Creating
                account…
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>
      </div>

      <style>{`
        .page-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f4f0;
          padding: 2rem 1rem;
          font-family: 'DM Sans', 'Helvetica Neue', sans-serif;
        }

        .card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #e4e2db;
          padding: 2.5rem 2rem;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }

        .card--narrow { text-align: center; padding: 3rem 2rem; }

        .card-header { text-align: center; margin-bottom: 1.75rem; }

        .logo {
          font-size: 2rem;
          display: block;
          margin-bottom: 1rem;
          color: #1a1916;
        }

        .card-title {
          font-size: 1.5rem;
          font-weight: 600;
          letter-spacing: -0.02em;
          color: #1a1916;
          margin: 0 0 0.5rem;
        }

        .card-subtitle {
          font-size: 0.9rem;
          color: #6b6a65;
          margin: 0;
        }

        .link {
          color: #1a1916;
          font-weight: 500;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .alert {
          border-radius: 8px;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          margin-bottom: 1.25rem;
        }

        .alert--error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
        }

        .form { display: flex; flex-direction: column; gap: 1rem; }

        .field-group { display: flex; flex-direction: column; gap: 0.375rem; }

        .field-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #1a1916;
        }

        .input-wrapper { position: relative; }

        .field-input {
          width: 100%;
          box-sizing: border-box;
          padding: 0.625rem 0.875rem;
          border: 1px solid #d4d2ca;
          border-radius: 8px;
          font-size: 0.9375rem;
          color: #1a1916;
          background: #fafaf8;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .field-input:focus {
          border-color: #1a1916;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(26,25,22,0.08);
        }

        .field-input--error { border-color: #dc2626; }

        .field-input--error:focus {
          border-color: #dc2626;
          box-shadow: 0 0 0 3px rgba(220,38,38,0.1);
        }

        .field-input:disabled { opacity: 0.5; cursor: not-allowed; }

        .input-right-slot {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
        }

        .toggle-btn {
          background: none;
          border: none;
          font-size: 0.8rem;
          font-weight: 500;
          color: #6b6a65;
          cursor: pointer;
          padding: 0;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .toggle-btn:hover { color: #1a1916; }

        .field-error {
          font-size: 0.8rem;
          color: #dc2626;
          margin: 0;
        }

        .strength-meter {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: -0.25rem;
        }

        .strength-track {
          display: flex;
          gap: 3px;
          flex: 1;
        }

        .strength-bar {
          height: 4px;
          flex: 1;
          border-radius: 99px;
          background: #e4e2db;
          transition: background 0.2s;
        }

        .strength-label {
          font-size: 0.75rem;
          font-weight: 500;
          min-width: 44px;
          text-align: right;
        }

        .checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 0.625rem;
          font-size: 0.875rem;
          color: #3d3c39;
          cursor: pointer;
          line-height: 1.5;
        }

        .checkbox-input {
          margin-top: 2px;
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          accent-color: #1a1916;
          cursor: pointer;
        }

        .submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.75rem 1.25rem;
          background: #1a1916;
          color: #f5f4f0;
          border: none;
          border-radius: 8px;
          font-size: 0.9375rem;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.1s;
          margin-top: 0.5rem;
          letter-spacing: -0.01em;
        }

        .submit-btn:hover:not(:disabled) { opacity: 0.88; }
        .submit-btn:active:not(:disabled) { transform: scale(0.99); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(245,244,240,0.4);
          border-top-color: #f5f4f0;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          display: inline-block;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .success-icon {
          font-size: 2.5rem;
          width: 60px;
          height: 60px;
          line-height: 60px;
          text-align: center;
          background: #f0fdf4;
          color: #16a34a;
          border-radius: 50%;
          margin: 0 auto 1.25rem;
        }

        @media (max-width: 480px) {
          .card { padding: 2rem 1.25rem; border-radius: 12px; }
        }
      `}</style>
    </main>
  );
};

export default SignupPage;