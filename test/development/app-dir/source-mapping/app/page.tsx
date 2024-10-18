import { Form } from './form'
import { foo } from './actions'
import Link from 'next/link'
import { ServerComponent } from './server-component'

export default function Page() {
  const bar = async () => {
    'use server'

    return 'declarator arrow function expression'
  }

  async function baz() {
    'use server'

    return 'function declaration'
  }

  return (
    <main>
      <ServerComponent />
      <Form action={foo} />
      <Form action={bar} />
      <Form action={baz} />
      <Form
        action={async () => {
          'use server'

          return 'arrow function expression'
        }}
      />
      <Form
        action={async function () {
          'use server'

          return 'anonymous function expression'
        }}
      />
      <Form
        action={async function myAction() {
          'use server'

          return 'named function expression'
        }}
      />
      <Link href="/client">client component page</Link>
    </main>
  )
}
