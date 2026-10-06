import { api } from '../api';
import { useForm } from '../hooks';
import { makeValidator, rules } from '../validation';
import { Alert, Button, Field, formatDate } from './ui';

const validate = makeValidator({
  body: [rules.required('Comment'), rules.maxLength('Comment', 5000)],
});

// Comment list plus reply form. `email` identifies a requester; agents omit it.
export default function Thread({ ticketId, comments, email, onPosted }) {
  const form = useForm({
    initial: { body: '' },
    validate,
    resetOnSuccess: true,
    onSubmit: async ({ body }) => {
      await api.addComment(ticketId, { body, email });
      await onPosted();
    },
  });

  return (
    <section>
      <h3>Conversation</h3>
      {comments.length === 0 && <p className="muted">No replies yet.</p>}
      <ul className="thread">
        {comments.map((c) => (
          <li key={c.id} className={c.isAgent ? 'from-agent' : ''}>
            <div className="meta">
              <strong>{c.author}</strong>
              {c.isAgent && <span className="tag">Agent</span>}
              <time>{formatDate(c.createdAt)}</time>
            </div>
            <p>{c.body}</p>
          </li>
        ))}
      </ul>
      <form onSubmit={form.handleSubmit} noValidate>
        <Alert>{form.formError}</Alert>
        <Field as="textarea" rows={3} label="Add a reply" {...form.bind('body')} />
        <Button busy={form.busy}>Post reply</Button>
      </form>
    </section>
  );
}
