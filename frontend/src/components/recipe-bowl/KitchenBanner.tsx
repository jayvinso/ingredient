import KitchenRadio from './KitchenRadio'
import './KitchenBanner.css'

type KitchenBannerProps = {
  homeHref?: string
}

function Starburst({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="
          M50 0
          L57 37
          L85 15
          L63 43
          L100 50
          L63 57
          L85 85
          L57 63
          L50 100
          L43 63
          L15 85
          L37 57
          L0 50
          L37 43
          L15 15
          L43 37
          Z
        "
      />
    </svg>
  )
}

export default function KitchenBanner({
  homeHref,
}: KitchenBannerProps) {
  const homeContent = (
    <>
      <span className="kitchen-banner__arrow">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M19 12H5" />
          <path d="m11 6-6 6 6 6" />
        </svg>
      </span>

      <span>All experiences</span>
    </>
  )

  return (
    <header className="kitchen-banner">
      <div
        className="kitchen-banner__decoration"
        aria-hidden="true"
      >
        <Starburst className="kitchen-banner__star kitchen-banner__star--left" />

        <Starburst className="kitchen-banner__star kitchen-banner__star--right" />

        <span className="kitchen-banner__dot kitchen-banner__dot--one" />
        <span className="kitchen-banner__dot kitchen-banner__dot--two" />
      </div>

      <div className="kitchen-banner__inner">
        <nav
          className="kitchen-banner__navigation"
          aria-label="Experience navigation"
        >
          {homeHref ? (
            <a
              className="kitchen-banner__home"
              href={homeHref}
            >
              {homeContent}
            </a>
          ) : (
            <span
              className="kitchen-banner__home kitchen-banner__home--pending"
              title="The experiences homepage is coming soon."
            >
              {homeContent}
            </span>
          )}
        </nav>

        <div className="kitchen-banner__sign">
          <div className="kitchen-banner__brand">
            <p className="kitchen-banner__eyebrow">
              A little something good
            </p>

            <p className="kitchen-banner__title">
              Domestic Bliss
            </p>

            <div className="kitchen-banner__subtitle">
              <span className="kitchen-banner__rule" />
              <span>The recipe kitchen</span>
              <span className="kitchen-banner__rule" />
            </div>
          </div>

          <Starburst className="kitchen-banner__sign-star" />
        </div>

        <div className="kitchen-banner__radio">
          <KitchenRadio />
        </div>
      </div>
    </header>
  )
}