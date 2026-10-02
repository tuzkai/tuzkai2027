import { useEffect, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetTuzakaiAdminSettingsQueryKey, useGetTuzakaiAdminSettings, useUpdateTuzakaiAdminSettings } from '@workspace/api-client-react';
import type { TuzakaiSocialLinks } from '@workspace/api-client-react';
import { PageHeading } from '../components/site';

type SettingsForm = {
  websiteUrl: string;
  supportEmail: string;
  businessEmail: string;
  socialLinks: Record<keyof TuzakaiSocialLinks, string>;
};

const emptyForm: SettingsForm = {
  websiteUrl: '',
  supportEmail: '',
  businessEmail: '',
  socialLinks: {
    instagram: '',
    facebook: '',
    pinterest: '',
    youtube: '',
    tiktok: '',
  },
};

const socialNames: Array<[keyof TuzakaiSocialLinks, string]> = [
  ['instagram', 'Instagram'],
  ['facebook', 'Facebook'],
  ['pinterest', 'Pinterest'],
  ['youtube', 'YouTube'],
  ['tiktok', 'TikTok'],
];

function errorStatus(error: unknown): number | undefined {
  if (error && typeof error === 'object' && 'status' in error) {
    return Number((error as { status?: unknown }).status);
  }
  return undefined;
}

function validUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

const socialHosts: Record<keyof TuzakaiSocialLinks, string[]> = {
  instagram: ['instagram.com'],
  facebook: ['facebook.com', 'fb.com'],
  pinterest: ['pinterest.com', 'pin.it'],
  youtube: ['youtube.com', 'youtu.be'],
  tiktok: ['tiktok.com'],
};

function validSocialUrl(network: keyof TuzakaiSocialLinks, value: string): boolean {
  if (!validUrl(value)) return false;
  const hostname = new URL(value).hostname;
  return socialHosts[network].some((host) => hostname === host || hostname.endsWith(`.${host}`));
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function AdminRestrictedNotice() {
  return (
    <div className="notice" role="alert" style={{ marginTop: 25, borderLeftColor: '#9D3D37' }}>
      Restricted access: your signed-in account is not authorized to manage TuzakAI site settings.
      If you believe this is an error, contact an administrator.
    </div>
  );
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const settingsQuery = useGetTuzakaiAdminSettings({
    query: { queryKey: getGetTuzakaiAdminSettingsQueryKey(), retry: (failureCount, error) => errorStatus(error) !== 403 && failureCount < 2 },
  });
  const updateSettings = useUpdateTuzakaiAdminSettings();
  const [form, setForm] = useState<SettingsForm>(emptyForm);
  const [validationError, setValidationError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!settingsQuery.data) return;
    setForm({
      websiteUrl: settingsQuery.data.websiteUrl ?? '',
      supportEmail: settingsQuery.data.supportEmail ?? '',
      businessEmail: settingsQuery.data.businessEmail ?? '',
      socialLinks: {
        instagram: settingsQuery.data.socialLinks.instagram ?? '',
        facebook: settingsQuery.data.socialLinks.facebook ?? '',
        pinterest: settingsQuery.data.socialLinks.pinterest ?? '',
        youtube: settingsQuery.data.socialLinks.youtube ?? '',
        tiktok: settingsQuery.data.socialLinks.tiktok ?? '',
      },
    });
  }, [settingsQuery.data]);

  const setField = (key: 'websiteUrl' | 'supportEmail' | 'businessEmail', value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved(false);
    setValidationError('');
  };

  const setSocial = (key: keyof TuzakaiSocialLinks, value: string) => {
    setForm((current) => ({ ...current, socialLinks: { ...current.socialLinks, [key]: value } }));
    setSaved(false);
    setValidationError('');
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationError('');
    setSaved(false);

    const websiteUrl = form.websiteUrl.trim();
    if (!websiteUrl || !validUrl(websiteUrl)) {
      setValidationError('Enter a valid HTTPS website URL.');
      return;
    }
    const supportEmail = form.supportEmail.trim();
    const businessEmail = form.businessEmail.trim();
    if (supportEmail && !validEmail(supportEmail)) {
      setValidationError('Enter a valid support email address or leave the field blank.');
      return;
    }
    if (businessEmail && !validEmail(businessEmail)) {
      setValidationError('Enter a valid business email address or leave the field blank.');
      return;
    }
    for (const [key, label] of socialNames) {
      const value = form.socialLinks[key].trim();
      if (value && !validSocialUrl(key, value)) {
        setValidationError(`${label} must use its official HTTPS website, or be left blank.`);
        return;
      }
    }

    try {
      await updateSettings.mutateAsync({
        data: {
          websiteUrl,
          supportEmail: supportEmail || null,
          businessEmail: businessEmail || null,
          socialLinks: {
            instagram: form.socialLinks.instagram.trim() || null,
            facebook: form.socialLinks.facebook.trim() || null,
            pinterest: form.socialLinks.pinterest.trim() || null,
            youtube: form.socialLinks.youtube.trim() || null,
            tiktok: form.socialLinks.tiktok.trim() || null,
          },
        },
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/tuzakai/admin/settings'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/tuzakai/settings'] }),
      ]);
      setSaved(true);
    } catch {
      setSaved(false);
      setValidationError('Unable to save settings. Please check the values and try again.');
    }
  };

  const isRestricted = errorStatus(settingsQuery.error) === 403 || errorStatus(updateSettings.error) === 403;

  return (
    <div className="container" style={{ maxWidth: 900, paddingBottom: 100 }}>
      <PageHeading
        kicker="SITE ADMINISTRATION"
        title="Website settings"
        description="Manage the public contact details and social links displayed across TuzakAI."
      />
      {isRestricted ? <AdminRestrictedNotice /> : null}
      {settingsQuery.isLoading ? <p className="muted" role="status">Loading administrator settings…</p> : null}
      {settingsQuery.error && !isRestricted ? (
        <div className="notice" role="alert" style={{ borderLeftColor: '#9D3D37' }}>
          Could not load administrator settings. Please try again. {settingsQuery.error.message}
        </div>
      ) : null}

      {!isRestricted && settingsQuery.data ? (
        <form className="card tool-panel stack" onSubmit={submit} noValidate>
          <p className="muted" style={{ marginTop: 0, lineHeight: 1.7 }}>
            Leave optional email and social fields blank to remove them. Values are published on the public site.
          </p>
          <label className="field">
            Website URL
            <input
              className="input"
              type="url"
              autoComplete="url"
              value={form.websiteUrl}
              onChange={(event) => setField('websiteUrl', event.target.value)}
              aria-label="Website URL"
            />
          </label>
          <div className="form-grid">
            <label className="field">
              Support email
              <input
                className="input"
                type="email"
                autoComplete="email"
                value={form.supportEmail}
                onChange={(event) => setField('supportEmail', event.target.value)}
                aria-label="Support email"
              />
            </label>
            <label className="field">
              Business email
              <input
                className="input"
                type="email"
                value={form.businessEmail}
                onChange={(event) => setField('businessEmail', event.target.value)}
                aria-label="Business email"
              />
            </label>
          </div>
          <div>
            <h2 className="serif" style={{ fontSize: 26, margin: '10px 0 17px' }}>Social links</h2>
            <div className="form-grid">
              {socialNames.map(([key, label]) => (
                <label className="field" key={key}>
                  {label}
                  <input
                    className="input"
                    type="url"
                    value={form.socialLinks[key]}
                    onChange={(event) => setSocial(key, event.target.value)}
                    aria-label={`${label} URL`}
                    placeholder="https://"
                  />
                </label>
              ))}
            </div>
          </div>
          {validationError ? <p className="error" role="alert">{validationError}</p> : null}
          {updateSettings.error && !isRestricted ? (
            <div className="notice" role="alert" style={{ borderLeftColor: '#9D3D37' }}>
              Settings could not be saved. Please try again. {updateSettings.error.message}
            </div>
          ) : null}
          {saved ? <p className="notice" role="status">Settings saved. Public site settings have been refreshed.</p> : null}
          <div className="row">
            <button className="btn btn-dark" type="submit" disabled={updateSettings.isPending}>
              {updateSettings.isPending ? 'Saving…' : 'Save settings'}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}