'use server'

import { redirect } from 'next/navigation'
import { refresh } from 'next/server'

export async function inc(value) {
  return value + 1
}

export async function dec(value) {
  return value - 1
}

export default async function (value) {
  return value * 2
}

export async function redirectAction(path) {
  redirect(path)
}

export async function refreshAction() {
  refresh()
}
