// pages/book/[id].jsx
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useEffect } from 'react'
import { withIronSessionSsr } from 'iron-session/next'
import sessionOptions from '../../config/session'
import { useBookContext } from '../../context/book'
import Header from '../../components/header'
import db from '../../db'
import styles from '../../styles/Book.module.css'

export const getServerSideProps = withIronSessionSsr(
  async function getServerSideProps({ req, res, params }) {
    const { user } = req.session || {}
    // Always tell the client whether we're logged in
    const props = { isLoggedIn: !!user }
    if (user) {
      props.user = user
      // If it's already in the user's favorites, return that record
      const favorite = await db.book.getByGoogleId(user.id, params.id)
      if (favorite) {
        props.book = favorite
      }
    }
    return { props }
  },
  sessionOptions
)

export default function Book({ book: favoriteBook, isLoggedIn }) {
  const router = useRouter()
  const bookId = router.query.id
  const [{ bookSearchResults }] = useBookContext()

  // Determine which "book" to render and whether it's a favorite
  const isFavoriteBook = !!favoriteBook
  const book = favoriteBook
    ? favoriteBook
    : bookSearchResults.find((b) => b.googleId === bookId)

  // If there's literally no book to show, send them home
  useEffect(() => {
    if (!favoriteBook && !book) {
      router.push('/')
    }
  }, [favoriteBook, book, router])

  // Add the current book (from context) to favorites
  async function addToFavorites() {
    const res = await fetch('/api/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(book),
    })
    if (res.ok) {
      router.replace(router.asPath)
    }
  }

  // Remove the current favorite (props.book) by its database _id
  async function removeFromFavorites() {
    const res = await fetch('/api/book', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: favoriteBook.id }),
    })
    if (res.ok) {
      router.replace(router.asPath)
    }
  }

  return (
    <>
      <Head>
        <title>{book?.title} | Booker</title>
        <meta name="description" content={`Viewing ${book?.title}`} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header isLoggedIn={isLoggedIn} />

      {book && (
        <main>
          <BookInfo isFavorite={isFavoriteBook} {...book} />

          <div className={styles.controls}>
            {!isLoggedIn ? (
              <>
                <p>Want to add this book to your favorites?</p>
                <Link href="/login">
                  <a className="button">Login</a>
                </Link>
              </>
            ) : isFavoriteBook ? (
              <button onClick={removeFromFavorites}>
                Remove from Favorites
              </button>
            ) : (
              <button onClick={addToFavorites}>
                Add to Favorites
              </button>
            )}

            <a href="#" onClick={() => router.back()}>
              Return
            </a>
          </div>
        </main>
      )}
    </>
  )
}

function BookInfo({
  title,
  authors = [],
  thumbnail,
  description = '',
  pageCount = 0,
  categories = [],
  previewLink = '',
  isFavorite,
}) {
  return (
    <>
      <div className={styles.titleGroup}>
        <div>
          <h1>
            {title}
            {isFavorite && <sup>⭐</sup>}
          </h1>
          {authors.length > 0 && (
            <h2>
              By: {authors.join(', ').replace(/, ([^,]*)$/, ', and $1')}
            </h2>
          )}
          {categories.length > 0 && (
            <h3>
              Category:{' '}
              {categories.join(', ').replace(/, ([^,]*)$/, ', and $1')}
            </h3>
          )}
        </div>
        <a
          target="_blank"
          rel="noreferrer"
          href={previewLink}
          className={styles.imgContainer}
        >
          <img
            src={
              thumbnail
                ? thumbnail
                : 'https://via.placeholder.com/128x190?text=NO COVER'
            }
            alt={title}
          />
          <span>Look Inside!</span>
        </a>
      </div>
      <p>
        Description:
        <br />
        {description}
      </p>
      <p>Pages: {pageCount}</p>
      <div className={styles.links}>
        <span>Order online:</span>
        <a
          target="_blank"
          rel="noreferrer"
          href={`https://www.amazon.com/s?k=${encodeURIComponent(
            title + ' ' + (authors[0] || '')
          )}`}
        >
          Amazon
        </a>
        <a
          target="_blank"
          rel="noreferrer"
          href={`https://www.barnesandnoble.com/s/${encodeURIComponent(
            title + ' ' + (authors[0] || '')
          )}`}
        >
          Barnes & Noble
        </a>
      </div>
    </>
  )
}
