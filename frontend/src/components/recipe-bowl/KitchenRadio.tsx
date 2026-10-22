import { useEffect, useRef, useState } from 'react'
import screwOnTheLoose from './assets/screw-on-the-loose.mp3'
import crepeSuzette from './assets/crepe-suzette.mp3'
import './KitchenRadio.css'

type Track = {
  id: string
  title: string
  artist: string
  src: string
}

const tracks: readonly Track[] = [
  {
    id: 'screw-on-the-loose',
    title: 'Screw on the Loose',
    artist: 'Anthony Lowry',
    src: screwOnTheLoose,
  },
  {
    id: 'crepe-suzette',
    title: 'Crepe Suzette',
    artist: 'Cyril Watters',
    src: crepeSuzette,
  },
]

type DialProps = {
  label: string
  caption: string
  value: number
  max: number
  valueText: string
  disabled?: boolean
  onChange: (value: number) => void
}

function RadioDial({
  label,
  caption,
  value,
  max,
  valueText,
  disabled = false,
  onChange,
}: DialProps) {
  const angle = disabled
    ? 0
    : -135 + (value / Math.max(1, max)) * 270

  return (
    <label
      className={`kitchen-radio__dial ${
        disabled ? 'is-disabled' : ''
      }`}
    >
      <span className="kitchen-radio__dial-control">
        <input
          type="range"
          min="0"
          max={max}
          step="1"
          value={value}
          disabled={disabled}
          onChange={(event) =>
            onChange(Number(event.target.value))
          }
          aria-label={label}
          aria-valuetext={valueText}
          title={
            disabled
              ? 'Only one song is loaded.'
              : 'Drag left or right, or use the arrow keys.'
          }
        />

        <span
          className="kitchen-radio__dial-face"
          style={{
            transform: `rotate(${angle}deg)`,
          }}
          aria-hidden="true"
        />
      </span>

      <span className="kitchen-radio__dial-caption">
        {caption}
      </span>
    </label>
  )
}

export default function KitchenRadio() {
  const player = useRef<HTMLAudioElement>(null)
  const request = useRef(0)

  const [trackIndex, setTrackIndex] = useState(0)
  const [volume, setVolume] = useState(25)
  const [playing, setPlaying] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const track = tracks[trackIndex]

  useEffect(() => {
    if (player.current) {
      player.current.volume = volume / 100
    }
  }, [volume, trackIndex])

  useEffect(() => {
    const audio = player.current

    return () => {
      request.current += 1
      audio?.pause()
    }
  }, [trackIndex])

  async function togglePlayback() {
    const audio = player.current
    if (!audio) return

    if (!audio.paused || pending) {
      request.current += 1
      audio.pause()
      setPlaying(false)
      setPending(false)
      return
    }

    const currentRequest = ++request.current

    setError('')
    setPending(true)

    try {
      if (audio.error) {
        audio.load()
      }

      await audio.play()

      if (currentRequest === request.current) {
        setPlaying(!audio.paused)
      }
    } catch {
      if (currentRequest === request.current) {
        setPlaying(false)
        setError(
          "Couldn't play this song. Press Play to try again.",
        )
      }
    } finally {
      if (currentRequest === request.current) {
        setPending(false)
      }
    }
  }

  function selectTrack(index: number) {
    if (!tracks[index] || index === trackIndex) return

    request.current += 1
    player.current?.pause()

    setPlaying(false)
    setPending(false)
    setError('')
    setTrackIndex(index)
  }

  return (
    <section
      className={`kitchen-radio ${
        playing ? 'is-playing' : ''
      }`}
      aria-label="Kitchen radio"
    >
      <div
        className="kitchen-radio__grille"
        aria-hidden="true"
      >
        <span className="kitchen-radio__badge">
          Kitchen Radio
        </span>

        <span className="kitchen-radio__light" />
      </div>

      <div className="kitchen-radio__dashboard">
        <RadioDial
          label="Radio volume"
          caption={`VOL · ${volume}%`}
          value={volume}
          max={100}
          valueText={`${volume} percent`}
          onChange={setVolume}
        />

        <div className="kitchen-radio__screen">
          <div
            className="kitchen-radio__scale"
            aria-hidden="true"
          >
            <span>88</span>
            <span>96</span>
            <span>104</span>
            <span>108</span>

            <i
              style={{
                left: `${
                  tracks.length === 1
                    ? 50
                    : 8 +
                      (trackIndex / (tracks.length - 1)) * 84
                }%`,
              }}
            />
          </div>

          <p
            className="kitchen-radio__song"
            title={track.title}
          >
            {track.title}
          </p>

          <p className="kitchen-radio__artist">
            {track.artist}
          </p>
        </div>

        <RadioDial
          label="Radio song selection"
          caption={`TUNE · ${trackIndex + 1}/${tracks.length}`}
          value={trackIndex}
          max={Math.max(1, tracks.length - 1)}
          valueText={`${track.title} by ${track.artist}`}
          disabled={tracks.length < 2}
          onChange={selectTrack}
        />
      </div>

      <div className="kitchen-radio__transport">
        <button
          className="kitchen-radio__play"
          type="button"
          onClick={() => {
            void togglePlayback()
          }}
          aria-label={
            pending
              ? 'Cancel starting radio'
              : playing
                ? 'Pause kitchen radio'
                : 'Play kitchen radio'
          }
        >
          <span aria-hidden="true">
            {playing || pending ? 'Ⅱ' : '▶'}
          </span>

          {pending
            ? 'Cancel'
            : playing
              ? 'Pause'
              : 'Play'}
        </button>

        <p
          className="kitchen-radio__status"
          role="status"
        >
          {pending
            ? 'Warming up…'
            : playing
              ? 'On air'
              : 'Paused'}

          {' · '}

          {tracks.length === 1
            ? '1 song'
            : `${tracks.length} songs`}
        </p>
      </div>

      {error && (
        <p
          className="kitchen-radio__error"
          role="alert"
        >
          {error}
        </p>
      )}

      <audio
        key={track.id}
        ref={player}
        src={track.src}
        preload="none"
        loop
        onPlaying={() => {
          if (!player.current?.paused) {
            setPlaying(true)
            setPending(false)
          }
        }}
        onPause={() => setPlaying(false)}
        onError={() => {
          request.current += 1
          setPlaying(false)
          setPending(false)
          setError(
            'This song is unavailable. Try again in a moment.',
          )
        }}
      />
    </section>
  )
}