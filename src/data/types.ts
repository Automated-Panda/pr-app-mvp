export type Role = 'admin' | 'writer' | 'provider'

export type InternalStatus = 'New' | 'Writing' | 'Written' | 'Delivered'
export type AirtableStatus = 'Scheduled' | 'In Progress' | 'Written' | 'Delivered' | 'Published'
export type ClientStatus = 'Active' | 'Paused' | 'Cancelled'
export type Priority = 'Low' | 'Medium' | 'High'
export type Platform = 'Google' | 'Trustpilot' | 'Facebook' | 'Yelp' | 'TripAdvisor'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  avatar?: string
  clientIds?: string[]
  assignedLocationIds?: string[]
}

export interface Client {
  id: string
  name: string
  status: ClientStatus
  packageName: string
  mrr: number
  notes: string
  createdAt: string
}

export interface Location {
  id: string
  clientId: string
  name: string
  city: string
  active: boolean
  platforms: Platform[]
  slaHours: number
  airtableLocationId: string
}

export interface ActivityEntry {
  id: string
  timestamp: string
  action: string
  userId?: string
  userName?: string
}

export interface Task {
  id: string
  clientId: string
  locationId: string
  platform: Platform
  dueAt: string
  priority: Priority
  airtableStatus: AirtableStatus
  internalStatus: InternalStatus
  writerId: string
  providerId?: string
  contentBrief: string
  contentDraft: string
  tone?: string
  wordCount?: number
  writtenAt?: string
  deliveredAt?: string
  activity: ActivityEntry[]
}
