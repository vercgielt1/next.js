import React, { Suspense } from 'react'
import { Dynamic } from '../../../components/dynamic'

export default async ({ params }) => {
  const { slug } = await params
  return (
    <Suspense fallback={<Dynamic pathname={`/loading/${slug}`} fallback />}>
      <Dynamic pathname={`/loading/${slug}`} />
    </Suspense>
  )
}

export const generateStaticParams = async () => {
  return [{ slug: 'a' }]
}
