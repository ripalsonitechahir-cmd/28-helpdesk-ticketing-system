import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { Alert, Button, Field } from '../components/ui';
import { useForm } from '../hooks';
import { makeValidator, rules } from '../validation';

const validate = makeValidator({
  email: [rules.required('Email'), rules.email],
  password: [rules.required('Password')],
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const form = useForm({
    initial: { email: '', password: '' },
    validate,
    onSubmit: async (values) => {
      await login(values);
      navigate('/board');
    },
  });

  return (
    <div className="card">
      <h1>Agent login</h1>
      <form onSubmit={form.handleSubmit} noValidate>
        <Alert>{form.formError}</Alert>
        <Field label="Email" type="email" autoComplete="username" {...form.bind('email')} />
        <Field label="Password" type="password" autoComplete="current-password" {...form.bind('password')} />
        <Button busy={form.busy}>Sign in</Button>
      </form>
    </div>
  );
}
