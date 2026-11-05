'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { saveAccountDetails } from '../lib/account/actions';
import { AVATAR_MAX_BYTES, AVATAR_TYPES } from '../lib/account/validation';

interface AccountDetailsProps {
  username: string;
  email: string;
  avatarUrl?: string;
}
type Field = 'username' | 'email' | 'photo' | 'password';

function AccountEditor({
  field,
  value,
  avatarUrl,
}: {
  field: Field;
  value: string;
  avatarUrl?: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState('');
  const [file, setFile] = useState<File>();
  const [draft, setDraft] = useState(value);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const label =
    field === 'username'
      ? 'Username'
      : field === 'password'
        ? 'Password'
        : field === 'email'
          ? 'Contact email'
          : 'Profile photo';
  const changeLabel = `Change ${field}`;

  useEffect(() => {
    if (editing) input.current?.focus();
  }, [editing]);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  function close() {
    setEditing(false);
    setPreview('');
    setFile(undefined);
    setDraft('');
    requestAnimationFrame(() => trigger.current?.focus());
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError('');
    const form = new FormData(event.currentTarget);
    form.set('field', field);
    if (field === 'photo' && file) form.set('photo', file);
    else form.set('value', draft);
    try {
      const result = await saveAccountDetails(form);
      if (result.error) setError(result.error);
      else {
        setMessage(`${label} saved.`);
        close();
        router.refresh();
      }
    } catch {
      setError('We could not save your changes. Please try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      className="account-section"
      aria-labelledby={`account-${field}-heading`}
    >
      <h2 id={`account-${field}-heading`}>{label}</h2>
      {field === 'photo' ? (
        preview || avatarUrl ? (
          // Signed storage URLs and browser previews are intentionally unoptimized.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="account-photo"
            src={preview || avatarUrl}
            alt={preview ? 'New profile photo preview' : 'Your profile photo'}
          />
        ) : (
          <div
            className="account-photo account-photo--empty"
            role="img"
            aria-label="Default profile photo"
          >
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <circle cx="16" cy="11" r="6" fill="currentColor" />
              <path d="M4 30c0-8 5-12 12-12s12 4 12 12" fill="currentColor" />
            </svg>
          </div>
        )
      ) : (
        <p className="account-value">
          {field === 'password' ? '••••••••' : value || 'No email added'}
        </p>
      )}
      {field === 'username' && (
        <p className="account-help">
          Used to sign in. Changing this updates your login username.
        </p>
      )}
      {field === 'email' && (
        <p className="account-help">
          Contact information only. Unverified; not used for login or password
          recovery.
        </p>
      )}
      {!editing ? (
        <button
          ref={trigger}
          className="secondary-action"
          type="button"
          onClick={() => {
            setDraft(value);
            setError('');
            setMessage('');
            setEditing(true);
          }}
        >
          {changeLabel}
        </button>
      ) : (
        <form
          className="account-editor"
          onSubmit={save}
          aria-label={`Edit ${label.toLowerCase()}`}
        >
          <label htmlFor={`account-${field}`}>
            {field === 'photo'
              ? 'Choose a photo'
              : field === 'password'
                ? 'Current password'
                : `New ${label.toLowerCase()}`}
          </label>
          {field === 'password' ? (
            <>
              <input
                ref={input}
                id="account-password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                disabled={pending}
                aria-label="Current password"
              />
              <label htmlFor="new-password">New password</label>
              <input
                id="new-password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                disabled={pending}
                aria-describedby="password-help"
              />
              <p id="password-help" className="account-help">
                At least 8 characters, including a digit.
              </p>
              <label htmlFor="confirm-password">Confirm new password</label>
              <input
                id="confirm-password"
                name="confirmation"
                type="password"
                autoComplete="new-password"
                required
                disabled={pending}
              />
            </>
          ) : field === 'photo' ? (
            <>
              <input
                ref={input}
                id={`account-${field}`}
                type="file"
                accept={AVATAR_TYPES.join(',')}
                disabled={pending}
                aria-describedby={`account-${field}-help`}
                aria-invalid={Boolean(error)}
                onChange={(event) => {
                  const selected = event.target.files?.[0];
                  setError('');
                  setFile(undefined);
                  setPreview('');
                  if (!selected) return;
                  if (
                    selected.size > AVATAR_MAX_BYTES ||
                    !AVATAR_TYPES.includes(selected.type)
                  ) {
                    setError('Choose a JPEG, PNG, or WebP photo up to 2 MB.');
                    return;
                  }
                  setFile(selected);
                  setPreview(URL.createObjectURL(selected));
                }}
              />
              <p id={`account-${field}-help`} className="account-help">
                JPEG, PNG, or WebP. Up to 2 MB and 16 megapixels.
              </p>
            </>
          ) : (
            <input
              ref={input}
              id={`account-${field}`}
              type={field === 'email' ? 'email' : 'text'}
              value={draft}
              maxLength={field === 'username' ? 30 : 254}
              minLength={field === 'username' ? 3 : undefined}
              required={field === 'username'}
              autoComplete={field === 'username' ? 'username' : 'email'}
              disabled={pending}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `account-${field}-error` : undefined}
              onChange={(event) => setDraft(event.target.value)}
            />
          )}
          {field === 'username' && (
            <>
              <p className="account-help">
                3–30 letters, numbers, or underscores.
              </p>
              <label htmlFor="username-current-password">
                Current password
              </label>
              <input
                id="username-current-password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                disabled={pending}
              />
            </>
          )}
          {error && (
            <p
              className="account-error"
              id={`account-${field}-error`}
              role="alert"
            >
              {error}
            </p>
          )}
          <div className="account-editor-actions">
            <button
              className="primary-action"
              type="submit"
              disabled={pending || (field === 'photo' && !file)}
            >
              {pending ? 'Saving…' : 'Save'}
            </button>
            <button
              className="secondary-action"
              type="button"
              disabled={pending}
              onClick={close}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      <p className="account-status" role="status">
        {message}
      </p>
    </section>
  );
}

export function AccountDetails({
  username,
  email,
  avatarUrl,
}: AccountDetailsProps) {
  return (
    <div className="account-details">
      <AccountEditor field="username" value={username} />
      <AccountEditor field="password" value="" />
      <AccountEditor field="email" value={email} />
      <AccountEditor field="photo" value="" avatarUrl={avatarUrl} />
    </div>
  );
}
