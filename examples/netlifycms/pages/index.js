import { attributes, html } from '../content/home.md'

const Home = () => (
  <>
    <h1>{attributes.title}</h1>
    <div dangerouslySetInnerHTML={{ __html: html }} />
    <style jsx>{`
      h1,
      div {
        text-align: center;
      }
    `}</style>
  </>
)

export default Home
