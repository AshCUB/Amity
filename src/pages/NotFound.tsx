import { asset } from '../asset'
import { Link } from 'react-router-dom'
import Header from '../components/Header'

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="page">
        <div className="empty-state tall">
          <img src={asset('/brand/yellow_spark.svg')} alt="" className="spark" />
          <h1>This page wandered off the shelf.</h1>
          <p>We couldn't find what you were looking for. Maybe it's tucked between two other books.</p>
          <Link to="/" className="btn btn-primary">Back to my shelf</Link>
        </div>
      </main>
    </>
  )
}
