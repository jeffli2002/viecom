'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from '@/i18n/navigation';
import {
  useAuthError,
  useAuthLoading,
  useClearError,
  useEmailSignup,
  useIsAuthenticated,
  useSetError,
} from '@/store/auth-store';
import Image from 'next/image';
import { useState } from 'react';

const MIN_PASSWORD_LENGTH = 8;
const STEPS = ['Profile', 'Address', 'Additional info', 'Payout method'] as const;
const STEP_ILLUSTRATIONS = [
  '/affiliate/signup/f5f98303bd64de2f72ed666fc9296abf.png',
  '/affiliate/signup/f49db831810a3bd5814b541d67f1044b.png',
  '/affiliate/signup/f5f98303bd64de2f72ed666fc9296abf.png',
  '/affiliate/signup/b44bc1e3a0ea26e37c92dab1f7c3b614.png',
];
const COUNTRIES = [
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'New Zealand',
  'Germany',
  'France',
  'Spain',
  'Italy',
  'Netherlands',
  'Sweden',
  'Norway',
  'Denmark',
  'Switzerland',
  'Poland',
  'Brazil',
  'Mexico',
  'Argentina',
  'Chile',
  'Colombia',
  'India',
  'Japan',
  'South Korea',
  'Singapore',
  'Malaysia',
  'Philippines',
  'Thailand',
  'Vietnam',
  'Indonesia',
  'Hong Kong',
  'Taiwan',
  'China',
  'United Arab Emirates',
  'Saudi Arabia',
  'Israel',
  'South Africa',
];

export function AffiliateSignup() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthLoading();
  const error = useAuthError();
  const clearError = useClearError();
  const setError = useSetError();
  const emailSignup = useEmailSignup();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [region, setRegion] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [channelInput, setChannelInput] = useState('');
  const [channels, setChannels] = useState<string[]>([]);
  const [payoutMethod, setPayoutMethod] = useState('alipay');
  const [payoutAccount, setPayoutAccount] = useState('');

  const handleAddChannel = () => {
    const trimmed = channelInput.trim();
    if (!trimmed) return;
    if (channels.includes(trimmed)) return;
    setChannels((prev) => [...prev, trimmed]);
    setChannelInput('');
  };

  const handleRemoveChannel = (value: string) => {
    setChannels((prev) => prev.filter((item) => item !== value));
  };

  const handleNextStep = () => {
    clearError();
    if (step === 0) {
      if (!name.trim()) {
        setError('Please enter your name.');
        return;
      }
      if (!email.trim()) {
        setError('Please enter your email.');
        return;
      }
      if (password.length < MIN_PASSWORD_LENGTH) {
        setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
        return;
      }
    }
    if (step === 1) {
      if (!address.trim() || !city.trim() || !country.trim() || !zipCode.trim() || !region.trim()) {
        setError('Please complete the address fields.');
        return;
      }
    }
    if (step === 3) {
      return;
    }
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBackStep = () => {
    clearError();
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const submitApplication = async () => {
    const response = await fetch('/api/affiliate/application', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        companyName: companyName.trim() || undefined,
        companyDescription: companyDescription.trim() || undefined,
        channels,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        country: country.trim() || undefined,
        zipCode: zipCode.trim() || undefined,
        region: region.trim() || undefined,
        payoutMethod,
        payoutAccount: payoutAccount.trim() || undefined,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error || 'Failed to submit application');
    }
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();

    if (step < STEPS.length - 1) {
      handleNextStep();
      return;
    }

    if (!payoutAccount.trim()) {
      setError('Please enter your payout account.');
      return;
    }

    try {
      if (!isAuthenticated) {
        const result = await emailSignup(email, password, name.trim());
        if (!result.success) {
          if (result.error) {
            setError(result.error);
          }
          return;
        }
      }

      await submitApplication();
      setName('');
      setEmail('');
      setPassword('');
      router.replace('/affiliate/dashboard');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit application.');
    }
  };

  return (
    <section className="section-base border-b-0 bg-main">
      <div className="container-base">
        <div className="rounded-3xl bg-rose-50/70 px-6 py-4 text-sm text-slate-600 shadow-sm dark:bg-slate-900/70 dark:text-slate-300">
          <div className="grid gap-4 md:grid-cols-4">
            {STEPS.map((label, index) => {
              const isActive = index === step;
              const isDone = index < step;
              return (
                <div key={label} className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold ${
                      isActive
                        ? 'border-rose-500 bg-rose-500 text-white'
                        : isDone
                          ? 'border-rose-300 text-rose-500'
                          : 'border-slate-200 text-slate-400 dark:border-slate-700 dark:text-slate-500'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-slate-400">
                      Step {index + 1}
                    </div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] items-start">
          <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <CardHeader>
              <CardTitle>{STEPS[step]}</CardTitle>
              <CardDescription>
                Unlock the earning potential of your channel by promoting an innovative and powerful
                AI video generator! You can earn a 30% commission on every first purchase, renewal
                or upgrade generated through your affiliate links.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup} className="grid gap-6">
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
                    {error}
                    <button
                      type="button"
                      onClick={clearError}
                      className="ml-2 underline hover:no-underline"
                    >
                      Close
                    </button>
                  </div>
                )}

                {step === 0 && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="affiliate-name">Name</Label>
                      <Input
                        id="affiliate-name"
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Your name"
                        required
                        disabled={isLoading}
                        autoComplete="name"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="affiliate-email">Email</Label>
                      <Input
                        id="affiliate-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        required
                        disabled={isLoading}
                        autoComplete="email"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="affiliate-password">Password</Label>
                      <Input
                        id="affiliate-password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                        required
                        minLength={MIN_PASSWORD_LENGTH}
                        disabled={isLoading}
                        autoComplete="new-password"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Minimum {MIN_PASSWORD_LENGTH} characters.
                      </p>
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="affiliate-address">Address</Label>
                      <Input
                        id="affiliate-address"
                        type="text"
                        value={address}
                        onChange={(event) => setAddress(event.target.value)}
                        placeholder="Street address"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="affiliate-city">City</Label>
                      <Input
                        id="affiliate-city"
                        type="text"
                        value={city}
                        onChange={(event) => setCity(event.target.value)}
                        placeholder="City"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="affiliate-country">Country</Label>
                      <select
                        id="affiliate-country"
                        value={country}
                        onChange={(event) => setCountry(event.target.value)}
                        required
                        disabled={isLoading}
                        className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        <option value="" disabled>
                          Select a country
                        </option>
                        {COUNTRIES.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="affiliate-zip">ZIP code</Label>
                      <Input
                        id="affiliate-zip"
                        type="text"
                        value={zipCode}
                        onChange={(event) => setZipCode(event.target.value)}
                        placeholder="ZIP code"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="affiliate-region">State/Region</Label>
                      <Input
                        id="affiliate-region"
                        type="text"
                        value={region}
                        onChange={(event) => setRegion(event.target.value)}
                        placeholder="State or region"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="affiliate-company">Company name</Label>
                      <Input
                        id="affiliate-company"
                        type="text"
                        value={companyName}
                        onChange={(event) => setCompanyName(event.target.value)}
                        placeholder="Company name"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="affiliate-description">Description</Label>
                      <Textarea
                        id="affiliate-description"
                        value={companyDescription}
                        onChange={(event) => setCompanyDescription(event.target.value)}
                        placeholder="Tell us about your channel"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="affiliate-channel">Your channels</Label>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Input
                          id="affiliate-channel"
                          type="text"
                          value={channelInput}
                          onChange={(event) => setChannelInput(event.target.value)}
                          placeholder="Channel link"
                          disabled={isLoading}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="border-slate-200"
                          onClick={handleAddChannel}
                        >
                          Add
                        </Button>
                      </div>
                      {channels.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {channels.map((channel) => (
                            <button
                              key={channel}
                              type="button"
                              onClick={() => handleRemoveChannel(channel)}
                              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                            >
                              {channel} ✕
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="affiliate-payout-method">Payout method</Label>
                      <select
                        id="affiliate-payout-method"
                        value={payoutMethod}
                        onChange={(event) => setPayoutMethod(event.target.value)}
                        className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        <option value="alipay">Alipay</option>
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="affiliate-payout-account">Alipay account</Label>
                      <Input
                        id="affiliate-payout-account"
                        type="text"
                        value={payoutAccount}
                        onChange={(event) => setPayoutAccount(event.target.value)}
                        placeholder="Alipay account"
                        disabled={isLoading}
                      />
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-200"
                    onClick={handleBackStep}
                    disabled={step === 0}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="btn-primary rounded-full px-10 py-5 text-base font-semibold"
                    disabled={isLoading}
                  >
                    {step < STEPS.length - 1 ? 'Next step' : isLoading ? 'Finishing...' : 'Finish'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="flex items-center justify-center">
            <Image
              src={STEP_ILLUSTRATIONS[step]}
              alt={`${STEPS[step]} illustration`}
              width={520}
              height={420}
              className="w-full max-w-lg object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
