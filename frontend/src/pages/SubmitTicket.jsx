import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Alert, Button, Field, Options } from '../components/ui';
import { PRIORITIES } from '../constants';
import { useForm } from '../hooks';
import { makeValidator, rules } from '../validation';

const initial = { subject: '', description: '', priority: 'Medium', email: '' };

const validate = makeValidator({
  subject: [rules.required('Subject'), rules.maxLength('Subject', 150)],
  description: [rules.required('Description'), rules.maxLength('Description', 5000)],
  email: [rules.required('Email'), rules.email],
});

export default function SubmitTicket() {
  const [created, setCreated] = useState(null);
  const form = useForm({
    initial,
    validate,
    resetOnSuccess: true,
    onSubmit: async (values) => setCreated({ ...(await api.createTicket(values)) }),
  });

  return (
    <div className="card">
      <h1>Submit a ticket</h1>
      {created && (
        <Alert kind="success">
          Ticket <strong>#{created.id}</strong> created. Keep this number — you can{' '}
          <Link to="/lookup">track it</Link> with your email.
        </Alert>
      )}
      <form onSubmit={form.handleSubmit} noValidate>
        <Alert>{form.formError}</Alert>
        <Field label="Your email" type="email" {...form.bind('email')} />
        <Field label="Subject" maxLength={150} {...form.bind('subject')} />
        <Field as="textarea" rows={5} label="Description" {...form.bind('description')} />
        <Field as="select" label="Priority" {...form.bind('priority')}>
          <Options items={PRIORITIES} />
        </Field>
        <Button busy={form.busy}>Submit ticket</Button>
      </form>
    </div>
  );
}
