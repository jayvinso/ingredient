import { useBowlSelection } from './useBowlSelection'

/** Temporary test buttons; never mounted in a production build. */
export default function SelectionDevTools() {
  const { addItem } = useBowlSelection()

  return (
    <details className="rb-devtools">
      <summary>Development: test selection</summary>
      <p>Temporary controls until the team's lists connect. Adding the same item twice keeps one copy.</p>
      <div className="rb-devtools-actions">
        <button type="button" onClick={() => addItem({
          id: 'demo-tomato', type: 'ingredient', name: 'Tomato', emoji: '🍅',
        })}>Add tomato</button>
        <button type="button" onClick={() => addItem({
          id: 'demo-pasta', type: 'ingredient', name: 'Pasta', emoji: '🍝',
        })}>Add pasta</button>
        <button type="button" onClick={() => addItem({
          id: 'demo-oven', type: 'appliance', name: 'Oven', emoji: '♨️',
        })}>Add oven</button>
      </div>
    </details>
  )
}
