import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { PriorityBadge } from '@/components/ui/priority-badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { PageHeader } from '@/components/ui/page-header'
import {
  Sparkles,
  Save,
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  Calendar,
  User,
  Globe,
  MapPin,
  Building2,
  Flag,
  Activity,
} from 'lucide-react'
import { cn, formatDate, formatRelativeTime } from '@/lib/utils'
import type { Platform } from '@/data/types'

/* ------------------------------------------------------------------ */
/*  Review templates                                                  */
/* ------------------------------------------------------------------ */

const templateOptions = [
  { value: '', label: 'Select a template...' },
  { value: 'service', label: '5-Star Service Review' },
  { value: 'product', label: 'Product Quality Review' },
  { value: 'location', label: 'Location Experience Review' },
  { value: 'staff', label: 'Exceptional Staff Review' },
  { value: 'value', label: 'Great Value Review' },
]

const templates: Record<string, string> = {
  service:
    'I recently had the pleasure of experiencing their outstanding service. From the moment I walked in, the team went above and beyond to ensure every detail was taken care of. The professionalism and warmth of the staff made the entire experience exceptional. I would highly recommend them to anyone looking for top-tier service. A well-deserved five stars!',
  product:
    'I have been thoroughly impressed with the quality of their products. Every item I have purchased has exceeded my expectations in terms of craftsmanship and durability. The attention to detail is remarkable, and you can tell they truly care about what they deliver. If you are looking for premium quality, look no further. Absolutely outstanding!',
  location:
    'What a wonderful location! The space is beautifully maintained, clean, and welcoming. From the tasteful decor to the convenient layout, everything about this place feels thoughtfully designed. The atmosphere is warm and inviting, making every visit a pleasure. Highly recommended for anyone in the area!',
  staff:
    'The staff here are truly exceptional. Every team member I interacted with was friendly, knowledgeable, and eager to help. They took the time to understand my needs and provided personalized recommendations that made all the difference. It is rare to find such genuine care and expertise. Five stars without hesitation!',
  value:
    'Incredible value for the price! I was pleasantly surprised by the quality and level of service given how reasonable the pricing is. They offer a premium experience without the premium price tag. If you are looking for a place that delivers outstanding results while respecting your budget, this is the one. Highly recommend!',
}

/* ------------------------------------------------------------------ */
/*  AI Assist mock generator                                          */
/* ------------------------------------------------------------------ */

function generateAiContent(platform: Platform, clientName: string, locationName: string): string {
  const platformCopy: Record<Platform, string> = {
    Google: `I recently visited ${locationName} and was thoroughly impressed with their service. The staff at ${clientName} was incredibly professional and attentive to every detail. From the welcoming atmosphere to the exceptional quality of their work, everything exceeded my expectations. I would highly recommend them to anyone looking for a reliable and top-notch experience. Five stars all the way!`,
    Trustpilot: `My experience with ${clientName} at their ${locationName} location has been nothing short of excellent. I was initially hesitant, but they quickly put my concerns at ease with their transparent approach and genuine commitment to customer satisfaction. The results speak for themselves, and I have already recommended them to several friends and family members. Truly a trustworthy business that delivers on its promises.`,
    Facebook: `Just had an amazing experience at ${locationName}! The team at ${clientName} really knows how to make you feel valued. Everything was handled with care and professionalism from start to finish. The atmosphere was welcoming, the service was prompt, and the results were beyond what I expected. If you are in the area, definitely check them out - you will not be disappointed! Highly recommend to all my friends.`,
    Yelp: `Where do I even begin? ${locationName} is hands down one of the best spots I have visited in a long time. The ${clientName} team has created something truly special here. The attention to detail is remarkable, the customer service is warm and genuine, and the overall experience left me wanting to come back for more. This place deserves every bit of praise it gets. Do not miss it!`,
    TripAdvisor: `During my recent visit to the area, I decided to try ${locationName} based on online recommendations, and I am so glad I did. ${clientName} has built a wonderful establishment that combines quality, comfort, and excellent service. The staff was accommodating, the facilities were pristine, and every aspect of my visit was enjoyable. A must-visit destination that I will certainly return to on my next trip!`,
  }
  return platformCopy[platform]
}

/* ------------------------------------------------------------------ */
/*  Activity dot color helper                                         */
/* ------------------------------------------------------------------ */

function activityDotColor(action: string): string {
  if (action.includes('Started')) return 'bg-blue-400'
  if (action.includes('Written') || action.includes('written')) return 'bg-peach-400'
  if (action.includes('Delivered') || action.includes('delivered')) return 'bg-emerald-400'
  if (action.includes('Saved') || action.includes('draft')) return 'bg-amber-400'
  if (action.includes('Reassigned')) return 'bg-purple-400'
  return 'bg-dark-400'
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function WriterTaskDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const tasks = useStore((s) => s.tasks)
  const clients = useStore((s) => s.clients)
  const locations = useStore((s) => s.locations)
  const users = useStore((s) => s.users)
  const saveDraft = useStore((s) => s.saveDraft)
  const markWritten = useStore((s) => s.markWritten)
  const startWriting = useStore((s) => s.startWriting)

  /* ---- loading simulation ---- */
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(timer)
  }, [])

  /* ---- lookup task ---- */
  const task = useMemo(() => tasks.find((t) => t.id === id), [tasks, id])
  const client = useMemo(
    () => clients.find((c) => c.id === task?.clientId),
    [clients, task],
  )
  const location = useMemo(
    () => locations.find((l) => l.id === task?.locationId),
    [locations, task],
  )
  const writer = useMemo(
    () => users.find((u) => u.id === task?.writerId),
    [users, task],
  )

  /* ---- editor state ---- */
  const [content, setContent] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')

  useEffect(() => {
    if (task) {
      setContent(task.contentDraft)
    }
  }, [task?.id])

  /* ---- word / char counts ---- */
  const wordCount = useMemo(() => {
    const trimmed = content.trim()
    if (!trimmed) return 0
    return trimmed.split(/\s+/).length
  }, [content])
  const charCount = content.length

  /* ---- template selection ---- */
  const handleTemplateChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value
      setSelectedTemplate(val)
      if (val && templates[val]) {
        setContent(templates[val])
      }
    },
    [],
  )

  /* ---- AI assist ---- */
  const handleAiAssist = useCallback(() => {
    if (!task) return
    const clientName = client?.name ?? 'this business'
    const locationName = location?.name ?? 'this location'
    const generated = generateAiContent(task.platform, clientName, locationName)
    setContent(generated)
    toast.success('AI content generated')
  }, [task, client, location])

  /* ---- save draft ---- */
  const handleSaveDraft = useCallback(() => {
    if (!task) return
    saveDraft(task.id, content)
    toast.success('Draft saved successfully')
  }, [task, content, saveDraft])

  /* ---- mark written ---- */
  const handleMarkWritten = useCallback(() => {
    if (!task) return
    saveDraft(task.id, content)
    markWritten(task.id)
    toast.success('Task marked as Written')
    navigate('/writer/queue')
  }, [task, content, saveDraft, markWritten, navigate])

  /* ---- skeleton loading ---- */
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  /* ---- not found ---- */
  if (!task) {
    return (
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Writer', href: '/writer/queue' },
            { label: 'Queue', href: '/writer/queue' },
            { label: 'Not Found' },
          ]}
        />
        <div className="text-center py-20">
          <h2 className="text-lg font-semibold text-dark-200">Task not found</h2>
          <p className="text-sm text-dark-500 mt-1">The task you are looking for does not exist.</p>
          <Button variant="secondary" className="mt-4" onClick={() => navigate('/writer/queue')}>
            Back to Queue
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Writer', href: '/writer/queue' },
          { label: 'Queue', href: '/writer/queue' },
          { label: `Task #${task.id.slice(0, 8)}` },
        ]}
      />

      {/* Page header */}
      <PageHeader
        title={`${client?.name ?? 'Unknown'} — ${location?.name ?? 'Unknown'}`}
        description={`${task.platform} review · Due ${formatDate(task.dueAt)}`}
        action={
          task.internalStatus === 'New' ? (
            <Button
              onClick={() => {
                startWriting(task.id)
                toast.success('Task moved to Writing')
              }}
            >
              Start Writing
            </Button>
          ) : undefined
        }
      />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ============================================================ */}
        {/* LEFT COLUMN (2/3)                                            */}
        {/* ============================================================ */}
        <div className="lg:col-span-2 space-y-5">
          {/* Brief Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText size={16} className="text-peach-400" />
                Content Brief
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-dark-200 leading-relaxed whitespace-pre-wrap">
                {task.contentBrief || 'No brief provided for this task.'}
              </p>
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-dark-700/50">
                {task.tone && (
                  <div>
                    <span className="text-xs text-dark-500 uppercase tracking-wider">Tone</span>
                    <p className="text-sm text-dark-200 mt-0.5 font-medium">{task.tone}</p>
                  </div>
                )}
                {task.wordCount && (
                  <div>
                    <span className="text-xs text-dark-500 uppercase tracking-wider">Target Words</span>
                    <p className="text-sm text-dark-200 mt-0.5 font-medium">{task.wordCount}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Template Dropdown */}
          <div>
            <label className="block text-xs font-medium text-dark-400 mb-1.5 uppercase tracking-wider">
              Template
            </label>
            <Select
              options={templateOptions}
              value={selectedTemplate}
              onChange={handleTemplateChange}
            />
          </div>

          {/* Content Editor */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare size={16} className="text-peach-400" />
                  Review Content
                </CardTitle>
                <Button size="sm" variant="outline" onClick={handleAiAssist}>
                  <Sparkles size={14} className="text-amber-400" />
                  AI Assist
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing your review content here..."
                className="min-h-[240px] text-sm leading-relaxed"
              />
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-4 text-xs text-dark-500">
                  <span>{wordCount} words</span>
                  <span>{charCount} characters</span>
                  {task.wordCount && (
                    <span
                      className={cn(
                        wordCount >= task.wordCount ? 'text-emerald-400' : 'text-dark-500',
                      )}
                    >
                      Target: {task.wordCount} words
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-dark-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Autosaved
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action buttons row */}
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleSaveDraft}>
              <Save size={14} />
              Save Draft
            </Button>
            <Button onClick={handleMarkWritten}>
              <CheckCircle2 size={14} />
              Mark Written
            </Button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN (1/3)                                           */}
        {/* ============================================================ */}
        <div className="space-y-5">
          {/* Context Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Task Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-xs text-dark-500">
                    <Building2 size={13} />
                    Client
                  </dt>
                  <dd className="text-sm text-dark-100 font-medium">
                    {client?.name ?? 'Unknown'}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-xs text-dark-500">
                    <MapPin size={13} />
                    Location
                  </dt>
                  <dd className="text-sm text-dark-100">
                    {location?.name ?? 'Unknown'}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-xs text-dark-500">
                    <Globe size={13} />
                    Platform
                  </dt>
                  <dd className="text-sm text-dark-100">{task.platform}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-xs text-dark-500">
                    <Calendar size={13} />
                    Due Date
                  </dt>
                  <dd
                    className={cn(
                      'text-sm font-medium',
                      new Date(task.dueAt) < new Date() ? 'text-red-400' : 'text-dark-100',
                    )}
                  >
                    {formatDate(task.dueAt)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-xs text-dark-500">
                    <Flag size={13} />
                    Priority
                  </dt>
                  <dd>
                    <PriorityBadge priority={task.priority} />
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-xs text-dark-500">
                    <User size={13} />
                    Writer
                  </dt>
                  <dd className="text-sm text-dark-100">{writer?.name ?? 'Unassigned'}</dd>
                </div>

                <div className="border-t border-dark-700/50 pt-3.5" />

                <div className="flex items-center justify-between">
                  <dt className="text-xs text-dark-500">Airtable Status</dt>
                  <dd className="text-xs text-dark-300">{task.airtableStatus}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-xs text-dark-500">Internal Status</dt>
                  <dd>
                    <StatusBadge status={task.internalStatus} />
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Activity Log Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity size={16} className="text-peach-400" />
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {task.activity.length === 0 ? (
                <p className="text-xs text-dark-500 text-center py-4">No activity yet</p>
              ) : (
                <div className="space-y-0">
                  {[...task.activity]
                    .sort(
                      (a, b) =>
                        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
                    )
                    .map((entry) => (
                      <div key={entry.id} className="flex gap-3 py-2.5 group">
                        <div className="flex flex-col items-center">
                          <span
                            className={cn(
                              'h-2 w-2 rounded-full mt-1.5 shrink-0',
                              activityDotColor(entry.action),
                            )}
                          />
                          <span className="w-px flex-1 bg-dark-700/50 group-last:bg-transparent" />
                        </div>
                        <div className="pb-2">
                          <p className="text-xs text-dark-200 leading-relaxed">
                            {entry.action}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {entry.userName && (
                              <span className="text-[10px] text-dark-500">{entry.userName}</span>
                            )}
                            <span className="flex items-center gap-1 text-[10px] text-dark-600">
                              <Clock size={10} />
                              {formatRelativeTime(entry.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
