import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Alert, Button, Field } from '../components/ui';
import { useForm } from '../hooks';
import { makeValidator, rules } from '../validation';

const validate = makeValidator({
  id: [rules.required('Ticket number'), rules.positiveInt('Ticket number')],
  email: [rules.required('Email'), rules.email],
});

export default function Lookup() {
  const navigate = useNavigate();
  const form = useForm({
    initial: { id: '', email: '' },
    validate,
    onSubmit: async ({ id, email }) => {
      const email_ = email.trim().toLowerCase();
      await api.getTicket(id.trim(), email_); // fail here (inline) if not found
      navigate(`/ticket/${id.trim()}?email=${encodeURIComponent(email_)}`);
    },
  });

  return (
    <div className="card">
      <h1>Track your ticket</h1>
      <form onSubmit={form.handleSubmit} noValidate>
        <Alert>{form.formError}</Alert>
        <Field label="Ticket number" inputMode="numeric" {...form.bind('id')} />
        <Field label="Email used when submitting" type="email" {...form.bind('email')} />
        <Button busy={form.busy}>Look up</Button>
      </form>
    </div>
  );
}
