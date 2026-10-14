'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Save, Settings } from 'lucide-react'
import { api, apiData } from '@/lib/api'
import type { Profile } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input, Label, FieldError, Textarea } from '@/components/ui/input'
import { Card, Badge } from '@/components/ui/card'

const schema = z.object({
  displayName: z.string().min(2, 'Use at least 2 characters.').max(120),
  username: z
    .string()
    .regex(/^[a-z0-9_]*$/i, 'Letters, numbers and underscores only.')
    .max(40)
    .optional()
    .or(z.literal('')),
  bio: z.string().max(600, 'Keep it under 600 characters.').optional(),
  phone: z.string().max(40).optional(),
  country: z.string().max(80).optional(),
  homeAirport: z.string().max(80).optional(),
})
type FormValues = z.infer<typeof schema>

export function ProfileSettings() {
  const queryClient = useQueryClient()

  const profile = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiData<Profile>('/api/v1/me'),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      displayName: profile.data?.displayName ?? '',
      username: profile.data?.username ?? '',
      bio: profile.data?.bio ?? '',
      phone: profile.data?.phone ?? '',
      country: profile.data?.country ?? '',
      homeAirport: profile.data?.homeAirport ?? '',
    },
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      api<Profile>('/api/v1/me', {
        method: 'PATCH',
        body: {
          displayName: values.displayName,
          username: values.username ? values.username : null,
          bio: values.bio || null,
          phone: values.phone || null,
          country: values.country || null,
          homeAirport: values.homeAirport || null,
        },
      }),
    onSuccess: async (envelope) => {
      if (envelope.success && envelope.data) {
        reset({
          displayName: envelope.data.displayName ?? '',
          username: envelope.data.username ?? '',
          bio: envelope.data.bio ?? '',
          phone: envelope.data.phone ?? '',
          country: envelope.data.country ?? '',
          homeAirport: envelope.data.homeAirport ?? '',
        })
      }
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })

  const resend = useMutation({
    mutationFn: () => api('/api/v1/me/resend-verification', { method: 'POST' }),
  })

  const me = profile.data

  return (
    <div className="mt-14 space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-4 w-4 text-teal" />
        <h2 className="font-display text-xl font-semibold">Profile settings</h2>
        {me && !me.emailVerified ? (
          <Badge tone="amber">Email unverified</Badge>
        ) : null}
      </div>

      {me && !me.emailVerified ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 bg-amber/5 p-4">
          <p className="text-sm text-ink-muted">
            Verify your email to secure account recovery and enable all features.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={resend.isPending}
            onClick={() => resend.mutate()}
          >
            {resend.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Resend verification email
          </Button>
        </Card>
      ) : null}

      <form
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        className="surface space-y-5 p-6"
        noValidate
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="displayName" required>
              Display name
            </Label>
            <Input id="displayName" autoComplete="name" {...register('displayName')} />
            <FieldError message={errors.displayName?.message} />
          </div>
          <div>
            <Label htmlFor="username">Username</Label>
            <Input id="username" autoComplete="username" placeholder="unique_handle" {...register('username')} />
            <FieldError message={errors.username?.message} />
          </div>
        </div>

        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" rows={3} placeholder="Where do you like to travel?" {...register('bio')} />
          <FieldError message={errors.bio?.message} />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" autoComplete="tel" {...register('phone')} />
            <FieldError message={errors.phone?.message} />
          </div>
          <div>
            <Label htmlFor="country">Country</Label>
            <Input id="country" autoComplete="country-name" {...register('country')} />
            <FieldError message={errors.country?.message} />
          </div>
          <div>
            <Label htmlFor="homeAirport">Home airport</Label>
            <Input id="homeAirport" placeholder="e.g. LHR" {...register('homeAirport')} />
            <FieldError message={errors.homeAirport?.message} />
          </div>
        </div>

        {mutation.isError ? (
          <FieldError message={(mutation.error as Error).message} />
        ) : null}
        {mutation.isSuccess ? (
          <p role="status" className="text-[13px] text-teal-dark">
            Profile saved.
          </p>
        ) : null}

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || mutation.isPending}>
            {isSubmitting || mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save profile
          </Button>
        </div>
      </form>
    </div>
  )
}
