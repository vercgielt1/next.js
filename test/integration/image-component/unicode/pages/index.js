import React from 'react'
import Image from 'next/image'
import img from '../public/äöü.png'

const Page = () => {
  return (
    <div>
      <h1>Unicode Image URL</h1>
      <Image id="static" src={img} />
      <Image id="internal" src="/äöü.png" width={400} height={400} />
      <Image
        id="external"
        src="https://image-optimization-test.vercel.app/äöü.png"
        width={400}
        height={400}
      />
      <Image id="internal-precent" src="/50%.jpg" width={200} height={200} />
      <Image
        id="external-precent"
        src="https://image-optimization-test.vercel.app/50%.jpg"
        width={200}
        height={200}
      />
    </div>
  )
}

export default Page
