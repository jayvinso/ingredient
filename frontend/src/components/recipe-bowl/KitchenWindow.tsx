export default function KitchenWindow() {
  return (
    <div className="kitchen-window" aria-hidden="true">
      <div className="kitchen-window__rod" />

      <div className="kitchen-window__reveal">
        <div className="kitchen-window__frame">
          <div className="kitchen-window__glass">
            <span className="kitchen-window__sun" />

            <span className="kitchen-window__cloud kitchen-window__cloud--one" />
            <span className="kitchen-window__cloud kitchen-window__cloud--two" />

            <span className="kitchen-window__distance" />
            <span className="kitchen-window__hedge" />
            <span className="kitchen-window__reflection" />
          </div>

          <div className="kitchen-window__panes" />
        </div>
      </div>

      <div className="kitchen-window__curtain kitchen-window__curtain--left" />
      <div className="kitchen-window__curtain kitchen-window__curtain--right" />
      <div className="kitchen-window__valance" />

      <div className="kitchen-window__sill">
        <span className="kitchen-window__plant">
          <span />
          <span />
        </span>
      </div>
    </div>
  )
}