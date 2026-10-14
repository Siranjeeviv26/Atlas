'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea, FieldError } from '@/components/ui/input'

const schema = z.object({
  name: z.string().min(2, 'Tell us your name.'),
  email: z.string().email('Enter a valid email address.'),
  phone: z.string().optional(),
  subject: z.string().min(3, 'Add a short subject.'),
  travellers: z
    .number({ message: 'Number of travellers is required.' })
    .int('Enter a whole number.')
    .min(1, 'At least 1 traveller.')
    .max(20, 'For groups over 20, email us directly.'),
  travelDate: z.string().optional(),
  message: z.string().min(10, 'A little more detail helps (10+ characters).'),
})
type FormValues = z.infer<typeof schema>

export function EnquiryForm({
  packageTitle,
  packageSlug,
  destinationName,
}: {
  packageTitle: string
  packageSlug: string
  destinationName: string
}) {
  const [done, setDone] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      subject: `Enquiry: ${packageTitle}`,
      travellers: 2,
      message: `Hi, I'm interested in the ${packageTitle} package in ${destinationName}.`,
    },
  })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    try {
      await api('/api/v1/enquiries', {
        method: 'POST',
        body: {
          name: values.name,
          email: values.email,
          phone: values.phone || undefined,
          subject: values.subject,
          message: values.message,
          travellers: values.travellers,
          travelDate: values.travelDate || undefined,
          packageSlug,
        },
      })
      setDone(true)
    } catch (error) {
      setServerError(
        error instanceof ApiError ? error.message : 'Could not send your enquiry. Try again.',
      )
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-teal/10 p-5 text-teal-dark">
        <p className="flex items-center gap-2 font-medium">
          <Check className="h-4 w-4" />
          Enquiry sent
        </p>
        <p className="mt-1.5 text-sm text-teal-dark/90">
          We reply within one working day — usually much sooner.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="enquiry-name" required>
          Your name
        </Label>
        <Input id="enquiry-name" autoComplete="name" {...register('name')} />
        <FieldError message={errors.name?.message} />
      </div>

      <div>
        <Label htmlFor="enquiry-email" required>
          Email
        </Label>
        <Input id="enquiry-email" type="email" autoComplete="email" {...register('email')} />
        <FieldError message={errors.email?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="enquiry-travellers" required>
            Travellers
          </Label>
          <Input
            id="enquiry-travellers"
            type="number"
            min={1}
            max={20}
            {...register('travellers', { valueAsNumber: true })}
          />
          <FieldError message={errors.travellers?.message} />
        </div>
        <div>
          <Label htmlFor="enquiry-date">Travel date</Label>
          <Input id="enquiry-date" type="date" {...register('travelDate')} />
          <FieldError message={errors.travelDate?.message} />
        </div>
      </div>

      <div>
        <Label htmlFor="enquiry-message" required>
          Message
        </Label>
        <Textarea id="enquiry-message" rows={4} {...register('message')} />
        <FieldError message={errors.message?.message} />
      </div>

      {serverError ? <FieldError message={serverError} /> : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Send enquiry
      </Button>
      <p className="text-center text-[12px] text-ink-faint">
        No payment required. We will confirm availability first.
      </p>
    </form>
  )
}
