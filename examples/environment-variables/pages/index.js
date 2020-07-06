import styles from '../styles.module.css'

const Code = (p) => <code className={styles.inlineCode} {...p} />

const IndexPage = () => (
  <div className={styles.container}>
    <div className={styles.card}>
      <h1>Environment Variables with Next.js</h1>
      <hr className={styles.hr} />
      <p>
        In the table below you'll see how{' '}
        <a href="https://nextjs.org/docs/basic-features/environment-variables#exposing-environment-variables-to-the-browser">
          environment variables can be exposed to the browser
        </a>{' '}
        with Next.js.
      </p>
      <p>
        In general only <Code>.env.local</Code> or <Code>.env</Code> are needed
        for this, but the table also features the usage of{' '}
        <Code>.env.develoment</Code> and <Code>.env.production</Code>.
      </p>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Variable Name</th>
            <th>Value</th>
            <th>Added By</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>NEXT_PUBLIC_ENV_VARIABLE</td>
            <td>{process.env.NEXT_PUBLIC_ENV_VARIABLE}</td>
            <td>
              <Code>.env</Code>
            </td>
          </tr>
          <tr>
            <td>NEXT_PUBLIC_ENV_LOCAL_VARIABLE</td>
            <td>{process.env.NEXT_PUBLIC_ENV_LOCAL_VARIABLE}</td>
            <td>
              <Code>.env.local</Code>
            </td>
          </tr>
          <tr>
            <td>NEXT_PUBLIC_DEVELOPMENT_ENV_VARIABLE</td>

            <td>{process.env.NEXT_PUBLIC_DEVELOPMENT_ENV_VARIABLE}</td>
            <td>
              <Code>.env.develoment</Code>
            </td>
          </tr>
          <tr>
            <td>NEXT_PUBLIC_PRODUCTION_ENV_VARIABLE</td>

            <td>{process.env.NEXT_PUBLIC_PRODUCTION_ENV_VARIABLE}</td>
            <td>
              <Code>.env.production</Code>
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        <Code>.env.local</Code> is not added by the example, because it must be
        ignored by git, but you can add it manually:
      </p>
      <pre>
        <code>cp .env.local.example .env.local</code>
      </pre>
      <p>
        Variables in <Code>.env.production</Code> won't be available if the app
        is running in development:
      </p>
      <pre>
        <code>npm run dev</code>
      </pre>
      <p>
        Similarly, variables in <Code>.env.develoment</Code> won't be available
        if the app is running on production:
      </p>
      <pre>
        <code>npm run build && npm run start</code>
      </pre>
    </div>
  </div>
)

// `getStaticProps`, and similar Next.js methods like `getStaticPaths` and `getServerSideProps`
// only run in Node.js. Check the terminal to see the environment variables
export async function getStaticProps() {
  // Using the variables below in the browser will return `undefined`. Next.js doesn't
  // expose environment variables unless they start with `NEXT_PUBLIC_`
  console.log('[Node.js only] ENV_VARIABLE:', process.env.ENV_VARIABLE)
  console.log(
    '[Server only] ENV_LOCAL_VARIABLE:',
    process.env.ENV_LOCAL_VARIABLE
  )

  return { props: {} }
}

export default IndexPage
